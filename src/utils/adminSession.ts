/**
 * Admin session tokens — SERVER ONLY.
 *
 * Never import this from a client component: it reads ADMIN_PASSWORD /
 * ADMIN_SESSION_SECRET from process.env.
 *
 * Token format (stateless, HMAC-signed):
 *   base64url(JSON{ v, iat, exp, nonce }) + "." + base64url(HMAC-SHA256(payload, secret))
 *
 * The raw admin password is NEVER placed in a cookie. The cookie only carries
 * this signed token; anyone who obtains it gets a time-boxed session, not the
 * password itself, and rotating ADMIN_SESSION_SECRET invalidates every session.
 *
 * Implemented with Web Crypto (crypto.subtle) so the exact same code runs in
 * Node route handlers and in the Edge middleware.
 */

export const ADMIN_COOKIE = 'admin_token';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const TOKEN_VERSION = 1;

interface SessionPayload {
  v: number;
  iat: number;
  exp: number;
  nonce: string;
}

// ─── base64url helpers ──────────────────────────────────────────────────────
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(str)) return null;
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  try {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();

// ─── Secret derivation ──────────────────────────────────────────────────────
/**
 * Resolve the HMAC key material.
 *  - Preferred: ADMIN_SESSION_SECRET (>= 32 random chars).
 *  - Fallback:  sha256("darb-admin-session:" + ADMIN_PASSWORD) so that a
 *    deployment without the dedicated secret still works, but the password
 *    itself is never used directly as the key.
 * Returns null when neither is configured (fail closed).
 */
async function getSecretBytes(): Promise<Uint8Array | null> {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return enc.encode(explicit);
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`darb-admin-session:${pw}`));
  return new Uint8Array(digest);
}

let keyPromise: Promise<CryptoKey | null> | null = null;
function getKey(): Promise<CryptoKey | null> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const secret = await getSecretBytes();
      if (!secret) return null;
      return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [
        'sign',
        'verify',
      ]);
    })();
  }
  return keyPromise;
}

async function hmac(key: CryptoKey, data: string): Promise<Uint8Array> {
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return new Uint8Array(sig);
}

/** Constant-time byte comparison (Node's timingSafeEqual is not available on Edge). */
export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ─── Public API ─────────────────────────────────────────────────────────────
/** Create a fresh signed session token. Returns null if the server has no secret configured. */
export async function createSessionToken(ttlSeconds = SESSION_TTL_SECONDS): Promise<string | null> {
  const key = await getKey();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const nonce = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const payload: SessionPayload = { v: TOKEN_VERSION, iat: now, exp: now + ttlSeconds, nonce };
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(key, payloadB64);
  return `${payloadB64}.${bytesToBase64Url(sig)}`;
}

/** Verify a token: signature (constant-time) + expiry + version. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const key = await getKey();
  if (!key) return false;

  const givenSig = base64UrlToBytes(sigB64);
  if (!givenSig) return false;
  const expectedSig = await hmac(key, payloadB64);
  if (!timingSafeEqualBytes(givenSig, expectedSig)) return false;

  const payloadBytes = base64UrlToBytes(payloadB64);
  if (!payloadBytes) return false;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(dec.decode(payloadBytes));
  } catch {
    return false;
  }
  if (!payload || payload.v !== TOKEN_VERSION) return false;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return false;
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) return false;
  return true;
}

/** Cookie attributes shared by issue/clear so they always match. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' (not 'strict'): the cookie is only consumed by same-origin fetches,
    // and Lax already withholds it on cross-site POST/fetch, which blocks CSRF.
    // 'strict' would drop the cookie on a top-level navigation to /admin from
    // an external link (Slack, email) and the admin would appear logged out.
    sameSite: 'lax' as const,
    path: '/',
  };
}

/** Extract a cookie value from a raw Cookie header (for runtimes without next/headers). */
export function readCookieFromHeader(cookieHeader: string | null, name = ADMIN_COOKIE): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * CSRF belt-and-braces for state-changing admin endpoints:
 * the request must originate from our own origin (Origin / Sec-Fetch-Site).
 */
export function isSameOriginRequest(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetch without Origin; cookie SameSite policy still applies
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

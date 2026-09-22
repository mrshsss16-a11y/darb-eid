import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  sessionCookieOptions,
  isSameOriginRequest,
} from '@/utils/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin-auth
 *
 * Verifies the admin password server-side and issues an HMAC-signed session
 * cookie (see src/utils/adminSession.ts). The password itself is NEVER put in
 * a cookie or shipped to the browser.
 *
 * Security measures:
 *  1. Password stored server-side only (ADMIN_PASSWORD env var).
 *  2. In-memory rate limiting: MAX_ATTEMPTS per IP per window, then a hard
 *     lock for LOCK_MS. Every failed attempt is additionally delayed by
 *     FAIL_DELAY_MS to slow brute force.
 *     NOTE: the map resets on every cold start (serverless). For persistent
 *     limiting in production use Upstash Redis / Vercel KV.
 *  3. Constant-time comparison to prevent timing attacks.
 *  4. Generic error messages.
 *  5. Same-origin check (CSRF) + SameSite=Lax, HttpOnly, Secure cookie.
 */

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const FAIL_DELAY_MS = 300;
const MAX_BODY_BYTES = 4 * 1024;

interface RateLimitEntry {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, RateLimitEntry>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** Milliseconds remaining on a lock, or 0 when the IP may try. */
function lockRemaining(ip: string): number {
  const entry = attempts.get(ip);
  const now = Date.now();
  if (!entry) return 0;
  if (entry.lockedUntil && now < entry.lockedUntil) return entry.lockedUntil - now;
  if (now > entry.resetAt) attempts.delete(ip);
  return 0;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
    entry.resetAt = now + LOCK_MS;
  }
  // Opportunistic GC so the map cannot grow without bound.
  if (attempts.size > 5000) {
    attempts.forEach((v, k) => {
      if (now > v.resetAt) attempts.delete(k);
    });
  }
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

/** Constant-time comparison over UTF-8 bytes (length difference does not short-circuit). */
function safeCompare(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let result = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) result |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return result === 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح' }, { status: 403, headers: NO_STORE });
  }

  const remaining = lockRemaining(ip);
  if (remaining > 0) {
    return NextResponse.json(
      { ok: false, message: 'تجاوزت عدد المحاولات المسموح بها. حاول مرة أخرى بعد 15 دقيقة.' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(Math.ceil(remaining / 1000)) } },
    );
  }

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, message: 'طلب غير صالح' }, { status: 413, headers: NO_STORE });
    }
    const { password } = JSON.parse(raw || '{}');
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      console.error('[admin-auth] ADMIN_PASSWORD env var is not set.');
      return NextResponse.json(
        { ok: false, message: 'خطأ في إعدادات الخادم. تواصل مع المسؤول.' },
        { status: 500, headers: NO_STORE },
      );
    }

    if (typeof password !== 'string' || password.length > 512 || !safeCompare(password, expected)) {
      recordFailure(ip);
      await sleep(FAIL_DELAY_MS);
      return NextResponse.json(
        { ok: false, message: 'كلمة المرور غير صحيحة' },
        { status: 401, headers: NO_STORE },
      );
    }

    const token = await createSessionToken();
    if (!token) {
      return NextResponse.json(
        { ok: false, message: 'خطأ في إعدادات الخادم. تواصل مع المسؤول.' },
        { status: 500, headers: NO_STORE },
      );
    }

    clearAttempts(ip);

    cookies().set(ADMIN_COOKIE, token, {
      ...sessionCookieOptions(),
      maxAge: SESSION_TTL_SECONDS,
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح' }, { status: 400, headers: NO_STORE });
  }
}

// Reject all other HTTP methods.
export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

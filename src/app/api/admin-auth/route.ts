import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin-auth
 *
 * Verifies the admin password server-side.
 * The password is stored in ADMIN_PASSWORD (no NEXT_PUBLIC_ prefix) so it
 * is NEVER shipped in the client bundle.
 *
 * Security measures:
 *  1. Password stored server-side only (ADMIN_PASSWORD env var).
 *  2. In-memory rate limiting: max 5 attempts per IP per 15 minutes.
 *     Resets after a successful login or after the window expires.
 *  3. Constant-time comparison to prevent timing attacks.
 *  4. Generic error messages to avoid user enumeration.
 */

// ─── In-memory rate limiter ────────────────────────────────────────────────
// NOTE: This resets on every cold-start (serverless). For persistent rate
// limiting in production, replace with Redis / Upstash.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const entry = attempts.get(ip);
  const now = Date.now();

  if (!entry || now > entry.resetAt) {
    // Fresh window
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

// ─── Constant-time string comparison (prevents timing attacks) ─────────────
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Check rate limit BEFORE reading the body.
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: 'تجاوزت عدد المحاولات المسموح بها. حاول مرة أخرى بعد 15 دقيقة.' },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const { password } = body;
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      // Server misconfiguration — fail closed, don't leak details.
      console.error('[admin-auth] ADMIN_PASSWORD env var is not set.');
      return NextResponse.json(
        { ok: false, message: 'خطأ في إعدادات الخادم. تواصل مع المسؤول.' },
        { status: 500 },
      );
    }

    if (typeof password !== 'string' || !safeCompare(password, expected)) {
      return NextResponse.json(
        { ok: false, message: 'كلمة المرور غير صحيحة' },
        { status: 401 },
      );
    }

    // Success — clear rate limit for this IP.
    clearAttempts(ip);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'طلب غير صالح' },
      { status: 400 },
    );
  }
}

// Reject all other HTTP methods.
export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

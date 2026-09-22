import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, sessionCookieOptions } from '@/utils/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin-logout — clears the session cookie.
 * Uses the same attributes as the issuing route so the browser matches the cookie.
 */
export async function POST() {
  cookies().set(ADMIN_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}

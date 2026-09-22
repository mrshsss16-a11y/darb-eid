import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/utils/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/session → { ok: boolean }
 *
 * Lets the client gate learn whether the HttpOnly session cookie is still
 * valid without ever seeing the token. Always answers 200 so nothing about
 * the session leaks through status codes or caches.
 * (The middleware exempts this path from its 401 so it can answer { ok:false }.)
 */
export async function GET() {
  const ok = await verifySessionToken(cookies().get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ ok }, { headers: { 'Cache-Control': 'no-store' } });
}

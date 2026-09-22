import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken, readCookieFromHeader } from '@/utils/adminSession';

/**
 * Edge middleware — first line of defence for the admin surface.
 *
 *  /api/admin/*        → requires a valid HMAC session cookie (401 otherwise),
 *                        except GET /api/admin/session which must be able to
 *                        answer { ok:false } to the client gate.
 *  /admin              → the page itself is allowed through (the login form
 *                        lives inside it and the dashboard only reads public
 *                        data), but it is marked no-store + noindex.
 *  /api/admin-auth     → not matched (login must be reachable).
 *
 * Verification uses Web Crypto (crypto.subtle) so it runs on the Edge runtime.
 *
 * Rate limiting: the login route keeps an in-memory limiter. On Vercel that is
 * per-instance; for real protection add Vercel WAF rate-limit rules on
 * /api/admin-auth (Project → Firewall) or Upstash Ratelimit here in middleware.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const path = pathname.replace(/\/+$/, ''); // tolerate trailingSlash: true

  if (path.startsWith('/api/admin')) {
    if (path === '/api/admin/session' && req.method === 'GET') {
      return NextResponse.next();
    }
    const token = req.cookies.get(ADMIN_COOKIE)?.value ?? readCookieFromHeader(req.headers.get('cookie'));
    if (!(await verifySessionToken(token))) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.next();
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy.
 *  - script-src: 'unsafe-eval' is ONLY needed by Next.js dev tooling (React
 *    Refresh / source-map eval). html-to-image does not eval; it uses blob:
 *    URLs for the SVG foreignObject snapshot. So eval is dropped in production.
 *    'unsafe-inline' stays because layout.tsx injects the theme bootstrap script
 *    (move it to a nonce if you ever want to drop it).
 *  - style-src:   Tailwind runtime + Google Fonts stylesheet.
 *  - font-src:    self (/public/fonts DIN) + Google Fonts CDN + data: (html-to-image
 *                 inlines @font-face sources as data URIs during export).
 *  - img-src:     data:/blob: for previews + https: (Supabase Storage, logo).
 *  - connect-src: Supabase REST + Realtime (wss) + Google Fonts (html-to-image
 *                 fetches font CSS/files to embed them in the export).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} blob:`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** HTTP Security Headers — applied to every response. */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy', value: csp },
];

/** Long-lived immutable caching for fingerprinted / never-changing static assets. */
const immutableCache = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isGithubActions && { output: 'export' }),
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
    // Restrict to known domains — avoid open proxy via Next Image.
    remotePatterns: [
      { protocol: 'https', hostname: 'ryfbpiyqwocuendcdpwy.supabase.co' },
      { protocol: 'https', hostname: 'www.darbstations.com.sa' },
      { protocol: 'https', hostname: 'fonts.gstatic.com' },
    ],
  },
  experimental: {
    largePageDataBytes: 256 * 1000,
  },
  trailingSlash: true,

  // NOTE: headers() are ignored for `output: 'export'` (static hosting must set them itself).
  async headers() {
    return [
      // Security headers everywhere.
      { source: '/(.*)', headers: securityHeaders },
      // API routes must never be cached by browsers or CDN.
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
      // Self-hosted fonts (public/fonts) — immutable; rename the file to bust.
      {
        source: '/fonts/(.*)',
        headers: [...immutableCache, { key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      // Static images/icons in /public.
      {
        source: '/:file((?:.*)\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      // Next's own hashed bundles are already immutable; make it explicit.
      { source: '/_next/static/(.*)', headers: immutableCache },
    ];
  },
};

export default nextConfig;

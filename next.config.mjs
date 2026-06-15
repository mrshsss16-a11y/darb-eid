const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

/**
 * HTTP Security Headers — applied to every response.
 * These protect against XSS, clickjacking, MIME-sniffing, and data leakage.
 */
const securityHeaders = [
  // Prevent clickjacking — only allow embedding from same origin.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't send Referer header to external domains.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by this app.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  // HSTS — force HTTPS for 1 year (only effective on HTTPS deployments).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Content-Security-Policy — whitelist only what the app needs.
  // - scripts: same-origin + blob (html-to-image uses blob workers)
  // - styles:  same-origin + Google Fonts + unsafe-inline (Tailwind runtime)
  // - fonts:   self + Google Fonts CDN
  // - images:  self + data URIs (template preview) + HTTPS (logo, Supabase)
  // - connect: self + Supabase (data) + Google Fonts
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

  // Attach security headers to all routes.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

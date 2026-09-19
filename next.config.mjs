const isProduction = process.env.NODE_ENV === 'production';

function objectStorageRemotePatterns() {
  const value = process.env.OBJECT_STORAGE_PUBLIC_URL;
  if (!value) return [];
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return [];
    return [{
      protocol: 'https',
      hostname: url.hostname,
      port: url.port,
      pathname: (url.pathname.replace(/\/$/, '') || '') + '/**'
    }];
  } catch {
    return [];
  }
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'" + (isProduction ? '' : " 'unsafe-eval'") + " https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  ...(isProduction ? ['upgrade-insecure-requests'] : [])
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  ...(isProduction
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : [])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@node-rs/argon2'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    remotePatterns: objectStorageRemotePatterns()
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/preview/:path*',
        headers: [
          ...securityHeaders,
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' }
        ]
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' }
        ]
      }
    ];
  }
};

export default nextConfig;

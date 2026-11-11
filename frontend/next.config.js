/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the site has no server routes, so it can be hosted on any
  // static host (Firebase Hosting free plan) with no Node server.
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    dangerouslyAllowSVG: true,
    unoptimized: true, // required by static export (no image server)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      ...(process.env.NEXT_PUBLIC_S3_BUCKET_DOMAIN
        ? [{
            protocol: 'https',
            hostname: process.env.NEXT_PUBLIC_S3_BUCKET_DOMAIN,
          }]
        : []),
      ...(process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN
        ? [{
            protocol: 'https',
            hostname: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
          }]
        : []),
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
};

module.exports = nextConfig;

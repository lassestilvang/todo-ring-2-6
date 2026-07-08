// @ts-check
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const withSentry = withSentryConfig({
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});

const securityHeaders = {
  headers: [
    {
      key: 'Cache-Control',
      value: 'no-store', // Because Next.js sends caching headers by default
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'geolocation=(), microphone=(), camera=(), fullscreen=(self)',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    },
  ],
};

const config: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    dynamicImport: true,
    optimizeCss: true,
    serverActions: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
        pathname: '**',
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(BundleAnalyzerPlugin);
    }
    return config;
  },
  trailingSlash: true,
  reactStrictMode: true,
  ...securityHeaders,
};

export default withSentry;
export const config = {
  experimental,
  serverActions: {
    authorization: {
      enabled: true, // Enable server actions authorization
    },
  },
};
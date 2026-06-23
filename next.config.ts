import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import type { webpack } from 'next/dist/build/webpack-config';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // External packages that should not be bundled for client
  serverExternalPackages: ['better-sqlite3'],
  // Turbopack configuration
  turbopack: {},
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // Path aliases and bundle analysis
  webpack: (config: webpack, { dev }: { dev: boolean }) => {
    // Path aliases
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = config.resolve.modules?.find(m => typeof m === 'string') || require('path').join(__dirname, 'src');

    // Bundle analyzer (optional) - enable with: npm run analyze
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(BundleAnalyzerPlugin);
    }
    return config;
  },
  // Performance monitoring
  experimental: {
    // lazyOnDemandImages: true, // Deprecated in Next.js 15
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: true, // Automatically upload source maps during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
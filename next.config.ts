const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    dynamicImport: true,
    optimizeCss: true,
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
  async webpack(config, { dev }) {
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(BundleAnalyzerPlugin);
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);

export const config = {
  // Experimental features can be enabled here
  experimental: {
    serverComponents: true,
    serverActions: true,
  },
};
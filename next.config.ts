import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;

import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Set TEST_MODE before any imports
    env: {
      TEST_MODE: 'true',
    },
    exclude: ['tests/e2e/**', 'node_modules/**'],
    include: ['tests/unit/**/*.test.ts'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/db': path.resolve(__dirname, 'db'),
        '@/db/db-client': path.resolve(__dirname, 'db/db-client.ts'),
        '@/db/index': path.resolve(__dirname, 'db/index.ts'),
        '@/types': path.resolve(__dirname, 'src/types/index.ts'),
        '@/lib': path.resolve(__dirname, 'src/lib'),
        '@/lib/repositories': path.resolve(__dirname, 'src/lib/repositories/index.ts'),
      },
    },
    optimizeDeps: {
      exclude: ['better-sqlite3'],
    },
    server: {
      deps: {
        inline: ['better-sqlite3'],
      },
    },
  },
});
/**
 * Vitest configuration for Node.js environment
 * Used for database tests that require native SQLite bindings
 */
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use Node.js environment for native module support
    env: {
      TEST_MODE: 'true',
    },
    include: ['tests/integration/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    setupFiles: ['./tests/integration/setup.ts'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/db': path.resolve(__dirname, 'db'),
        '@/types': path.resolve(__dirname, 'src/types/index.ts'),
        '@/lib': path.resolve(__dirname, 'src/lib'),
      },
    },
    // Optimize deps to properly handle native modules
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
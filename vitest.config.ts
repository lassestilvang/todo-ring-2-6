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
    exclude: ['tests/e2e/**', 'node_modules/**', 'tests/unit/repositories-integration.test.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/snapshot/**/*.test.ts',
      'tests/property/**/*.test.ts'
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/db': path.resolve(__dirname, 'db'),
        '@/db/db-client': path.resolve(__dirname, 'db/db-client.ts'),
        '@/db/index': path.resolve(__dirname, 'db/index.ts'),
        '@/types': path.resolve(__dirname, 'src/types/index.ts'),
        '@/lib': path.resolve(__dirname, 'src/lib'),
        '@/lib/repositories': path.resolve(__dirname, 'src/lib/repositories/index.ts'),
        '@/lib/rate-limiter': path.resolve(__dirname, 'src/lib/rate-limiter.ts'),
        '@/lib/server-cache': path.resolve(__dirname, 'src/lib/server-cache.ts'),
        '@test-utils': path.resolve(__dirname, 'tests/unit/utils/test-helpers.ts'),
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.config.ts',
        'src/**/types/index.ts',
        'src/**/index.ts',
        'src/**/constants.ts',
        'src/lib/env.ts' // Exclude env validation from coverage as it's called at module level
      ],
      verbose: true,
      silent: false,
      strategy: 'exact',
      clean: true,
      cleanOnRerun: true,
      reportsDirectory: './coverage',
    },
    timeout: 15000,
    zombieTimeout: 10000,
    // Test retry for flaky tests
    retry: 2,
    // Sharding for parallel execution - DISABLED due to compatibility issue
    // shard: true,
    // Type checking during test
    typecheck: {
      enabled: true,
    },
  },
});
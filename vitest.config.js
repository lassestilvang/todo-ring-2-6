// Minimal Vitest Configuration for Testing Rate Limiter
// Works with available dependencies without external plugins

module.exports = {
  test: {
    globals: true,
    environment: 'node', // Use node instead of jsdom
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
};
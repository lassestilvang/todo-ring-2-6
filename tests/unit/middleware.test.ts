/**
 * Tests for src/middleware.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Middleware', () => {
  describe('Module Structure', () => {
    it('should export middleware function', async () => {
      const module = await import('../../src/middleware');
      expect(typeof module.middleware).toBe('function');
    });

    it('should export config object', async () => {
      const module = await import('../../src/middleware');
      expect(module.config).toBeDefined();
      expect(module.config.matcher).toBeDefined();
    });
  });

  describe('Config', () => {
    it('should have matcher config for all routes', async () => {
      const module = await import('../../src/middleware');
      expect(module.config.matcher).toBeDefined();
      expect(Array.isArray(module.config.matcher) || typeof module.config.matcher === 'object').toBe(true);
    });
  });
});
/**
 * Comprehensive tests for src/lib/rate-limiter.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to test the module's internal store
// Create a fresh module import by clearing the module cache
const importRateLimiter = async () => {
  // Clear the module cache
  vi.resetModules();
  return await import('../../src/lib/rate-limiter');
};

describe('Rate Limiter - Comprehensive', () => {
  describe('rateLimit', () => {
    it('should allow requests under the limit', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('test-client', 10, 60000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
    });

    it('should block requests over the limit', async () => {
      const { rateLimit } = await importRateLimiter();
      const client = 'test-client-exceeded-comprehensive';

      // Hit the limit
      for (let i = 0; i < 5; i++) {
        rateLimit(client, 5, 60000);
      }

      const result = rateLimit(client, 5, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use default values', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('default-test-comprehensive');
      expect(result.limit).toBe(100);
      expect(result.success).toBe(true);
    });

    it('should track different clients separately', async () => {
      const { rateLimit } = await importRateLimiter();
      const client1 = 'client-1';
      const client2 = 'client-2';

      // Hit limit for client1
      for (let i = 0; i < 3; i++) {
        rateLimit(client1, 3, 60000);
      }

      // client2 should still have capacity
      const result1 = rateLimit(client1, 3, 60000);
      const result2 = rateLimit(client2, 10, 60000);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(true);
    });

    it('should reset limit after window expires', async () => {
      const { rateLimit } = await importRateLimiter();
      const client = 'expiring-client';
      const shortWindow = 100; // 100ms

      // Hit the limit
      for (let i = 0; i < 2; i++) {
        rateLimit(client, 2, shortWindow);
      }

      // Should be blocked
      let result = rateLimit(client, 2, shortWindow);
      expect(result.success).toBe(false);

      // Wait for window to expire
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          result = rateLimit(client, 2, shortWindow);
          expect(result.success).toBe(true);
          expect(result.remaining).toBe(1);
          resolve();
        }, 150);
      });
    });

    it('should return correct remaining count', async () => {
      const { rateLimit } = await importRateLimiter();
      const result1 = rateLimit('remaining-test', 10, 60000);
      expect(result1.remaining).toBe(9);

      const result2 = rateLimit('remaining-test', 10, 60000);
      expect(result2.remaining).toBe(8);
    });

    it('should handle zero limit', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('zero-limit-client', 0, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle very large limits', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('large-limit-client', 1000000, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(999999);
    });

    it('should return reset timestamp', async () => {
      const { rateLimit } = await importRateLimiter();
      const now = Date.now();
      const result = rateLimit('reset-test', 10, 60000);

      expect(result.reset).toBeGreaterThan(now);
      expect(result.reset).toBeLessThanOrEqual(now + 60000);
    });

    it('should handle special characters in key', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('key-with-special-chars!@#$%', 10, 60000);
      expect(result.success).toBe(true);
    });

    it('should handle empty key', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('', 10, 60000);
      expect(result.success).toBe(true);
    });

    it('should handle unicode in key', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('unicode-key-日本語-émoji', 10, 60000);
      expect(result.success).toBe(true);
    });
  });
});
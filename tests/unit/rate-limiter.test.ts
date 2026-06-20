import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '../../src/lib/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear storage between tests
    if (typeof global !== 'undefined' && (global as any).__rateLimitStore) {
      (global as any).__rateLimitStore = {};
    }
  });

  describe('rateLimit', () => {
    it('should allow requests under the limit', () => {
      const result = rateLimit('test-client', 10, 60000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
    });

    it('should block requests over the limit', () => {
      const client = 'test-client-exceeded';

      // Hit the limit
      for (let i = 0; i < 5; i++) {
        rateLimit(client, 5, 60000);
      }

      const result = rateLimit(client, 5, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use default values', () => {
      const result = rateLimit('default-test');
      expect(result.limit).toBe(100);
      expect(result.success).toBe(true);
    });
  });
});
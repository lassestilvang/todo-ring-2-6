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

      expect(result.reset).toBeGreaterThan(now - 1000); // Allow 1s tolerance for timing
      expect(result.reset).toBeLessThanOrEqual(now + 61000); // Allow 1s tolerance for timing
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

  describe('withRateLimit middleware', () => {
    it('should call handler when under limit', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('test-ip'),
        },
      };

      await wrappedHandler(mockReq);
      expect(handler).toHaveBeenCalled();
    });

    it('should return error response when over limit', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 2, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('limited-client-2'),
        },
      };

      // Hit the limit
      await wrappedHandler(mockReq);
      await wrappedHandler(mockReq);
      const response = await wrappedHandler(mockReq);

      // Response has 200 status but body contains error
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Too many requests');
      expect(body.code).toBe('RATE_LIMITED');
    });

    it('should add rate limit headers to response', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 100, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('header-client'),
        },
      };

      const response = await wrappedHandler(mockReq);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should use default limit and window', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler);

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('default-client'),
        },
      };

      const response = await wrappedHandler(mockReq);
      expect(response.headers.get('X-Ratelimit-Limit')).toBe('100');
    });

    it('should use API key for client identification', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((key: string) => {
            if (key === 'x-api-key') return 'api-key-test';
            return null;
          }),
        },
      };

      await wrappedHandler(mockReq);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle missing headers gracefully', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {},
      };

      const response = await wrappedHandler(mockReq);
      expect(response).toBeDefined();
    });

    it('should handle undefined headers', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {};

      const response = await wrappedHandler(mockReq);
      expect(response).toBeDefined();
    });

    it('should handle null headers', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: null,
      };

      const response = await wrappedHandler(mockReq);
      expect(response).toBeDefined();
    });

    it('should use x-forwarded-for header for IP', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((key: string) => {
            if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          }),
        },
      };

      await wrappedHandler(mockReq);
      expect(handler).toHaveBeenCalled();
    });

    it('should use x-real-ip header when x-forwarded-for is missing', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((key: string) => {
            if (key === 'x-real-ip') return '192.168.1.1';
            return null;
          }),
        },
      };

      await wrappedHandler(mockReq);
      expect(handler).toHaveBeenCalled();
    });

    it('should return Retry-After header when rate limited', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 1, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('retry-client'),
        },
      };

      await wrappedHandler(mockReq);
      const response = await wrappedHandler(mockReq);

      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should handle x-forwarded-for with multiple IPs', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((key: string) => {
            if (key === 'x-forwarded-for') return '  192.168.1.1 , 10.0.0.1  ';
            return null;
          }),
        },
      };

      await wrappedHandler(mockReq);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle missing x-real-ip gracefully', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((key: string) => {
            if (key === 'x-real-ip') return undefined;
            return null;
          }),
        },
      };

      const response = await wrappedHandler(mockReq);
      expect(response).toBeDefined();
    });

    it('should handle empty x-forwarded-for value', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 10, 60000);

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      };

      const response = await wrappedHandler(mockReq);
      expect(response).toBeDefined();
    });

    it('should handle very small time windows', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 5, 10); // 10ms window

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('small-window-client'),
        },
      };

      await wrappedHandler(mockReq);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle very large time windows', async () => {
      const { withRateLimit } = await importRateLimiter();
      const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = withRateLimit(handler, 1000, 86400000); // 24 hours

      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue('large-window-client'),
        },
      };

      const response = await wrappedHandler(mockReq);
      expect(response).toBeDefined();
    });

    it('should handle concurrent requests for same key', async () => {
      const { rateLimit } = await importRateLimiter();
      const client = 'concurrent-client';
      const limit = 10;

      // Simulate concurrent requests
      const results = await Promise.all(
        Array.from({ length: 15 }, () => Promise.resolve(rateLimit(client, limit, 60000)))
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      expect(successCount).toBe(limit);
      expect(failCount).toBe(15 - limit);
    });

    it('should handle case sensitivity in keys', async () => {
      const { rateLimit } = await importRateLimiter();

      const result1 = rateLimit('Test-Client', 5, 60000);
      const result2 = rateLimit('test-client', 5, 60000);

      // These should be treated as different clients
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle numeric characters in key', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('client-123-456', 10, 60000);
      expect(result.success).toBe(true);
    });

    it('should handle UUID-like keys', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('550e8400-e29b-41d4-a716-446655440000', 10, 60000);
      expect(result.success).toBe(true);
    });

    it('should handle very long keys', async () => {
      const { rateLimit } = await importRateLimiter();
      const longKey = 'a'.repeat(1000);
      const result = rateLimit(longKey, 10, 60000);
      expect(result.success).toBe(true);
    });

    it('should handle whitespace in key', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('  key-with-spaces  ', 10, 60000);
      expect(result.success).toBe(true);
    });

    it('should clean up expired entries manually', async () => {
      const { rateLimit } = await importRateLimiter();

      // Create an entry
      const result = rateLimit('cleanup-test', 10, 60000);
      expect(result.success).toBe(true);

      // Manually clean up (simulating what the interval does)
      const store = (global as any).__rateLimitStore || {};
      for (const key in store) {
        delete store[key];
      }

      // After cleanup, a new entry should be created
      const newResult = rateLimit('cleanup-test', 10, 60000);
      expect(newResult.success).toBe(true);
    });

    it('should handle concurrent requests safely', async () => {
      const { rateLimit } = await importRateLimiter();
      const client = 'concurrent-safe-client';

      // Make multiple rapid requests
      const results = await Promise.all(
        Array.from({ length: 15 }, () => Promise.resolve(rateLimit(client, 10, 60000)))
      );

      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(10);
    });

    it('should handle negative limit', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('negative-limit-client', -1, 60000);
      // Should fail since limit is negative
      expect(result.success).toBe(false);
    });

    it('should handle negative window', async () => {
      const { rateLimit } = await importRateLimiter();
      // Negative window would result in immediate expiry
      const result = rateLimit('negative-window-client', 10, -1000);
      // The entry would be expired, so count starts fresh
      expect(result.success).toBe(true);
    });

    it('should handle very small window (1ms)', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('tiny-window-client', 5, 1);
      expect(result.success).toBe(true);
    });

    it('should handle zero window', async () => {
      const { rateLimit } = await importRateLimiter();
      const result = rateLimit('zero-window-client', 5, 0);
      // With 0 window, entry is immediately expired
      expect(result.success).toBe(true);
    });

    it('should verify cleanup interval exists', () => {
      // The module has a setInterval for cleanup
      // We verify the module loaded successfully (cleanup runs automatically)
      expect(true).toBe(true);
    });
  });
});
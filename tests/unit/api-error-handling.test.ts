import { describe, it, expect } from 'vitest';
import { jsonUnauthorized, jsonForbidden, jsonRateLimit } from '../../src/lib/api-response';

describe('API Error Helpers', () => {
  describe('jsonUnauthorized', () => {
    it('should return unauthorized error', async () => {
      const response = jsonUnauthorized();
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(result.code).toBe('UNAUTHORIZED');
      expect(response.status).toBe(401);
    });
  });

  describe('jsonForbidden', () => {
    it('should return forbidden error with default action', async () => {
      const response = jsonForbidden();
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden');
      expect(result.code).toBe('FORBIDDEN');
    });

    it('should return forbidden error with custom action', async () => {
      const response = jsonForbidden('delete this resource');
      const result = await response.json();
      expect(result.error).toContain('delete this resource');
    });
  });

  describe('jsonRateLimit', () => {
    it('should return rate limit error', async () => {
      const response = jsonRateLimit();
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests');
      expect(result.code).toBe('RATE_LIMITED');
      expect(response.status).toBe(429);
    });

    it('should include retry-after header when provided', async () => {
      const response = jsonRateLimit(60);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });
});

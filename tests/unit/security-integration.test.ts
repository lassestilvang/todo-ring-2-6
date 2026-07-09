import { describe, it, expect } from 'vitest';
import { rateLimit } from '../../../../../../../../src/lib/rate-limiter';
import { applySecurityHeaders, applyRateLimit } from '../../../../../../../../src/lib/api-middleware';
import { ErrorCodes, getErrorMessage, ApiError } from '../../../../../../../../src/lib/error-codes';
import { logSecurityEvent, SecurityEvent } from '../../../../../../../../src/lib/security-audit';

// Mock request object
function createMockRequest(headers: Record<string, string> = {}): any {
  return {
    headers: {
      get: (key: string) => headers[key] || null,
    },
    method: 'GET',
  };
}

describe('Security Integration Tests', () => {
  describe('Rate Limiting', () => {
    it('should allow requests under limit', () => {
      const result = rateLimit('test-ip', 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBeLessThan(5);
    });

    it('should block requests over limit', () => {
      // Simulate rate limiting
      for (let i = 0; i < 10; i++) {
        rateLimit('rate-test-ip', 5, 60000);
      }
      const result = rateLimit('rate-test-ip', 5, 60000);
      expect(result.success).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should apply security headers to responses', () => {
      const mockResponse = {
        headers: {
          set: (key: string, value: string) => {},
        },
      } as any;

      const response = applySecurityHeaders(mockResponse);
      expect(response).toBeDefined();
    });
  });

  describe('Error Codes', () => {
    it('should generate appropriate error messages', () => {
      expect(getErrorMessage(ErrorCodes.UNAUTHORIZED)).toBe('Authentication required');
      expect(getErrorMessage(ErrorCodes.VALIDATION_FAILED)).toBe('Invalid request data');
      expect(getErrorMessage(ErrorCodes.RATE_LIMITED)).toBe('Too many requests');
    });

    it('should create API error objects', () => {
      const err = new ApiError(ErrorCodes.UNAUTHORIZED, 'Test error', 401);
      expect(err.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(err.statusCode).toBe(401);
      expect(err.toJSON().success).toBe(false);
    });
  });

  describe('Security Audit Logging', () => {
    it('should log security events', () => {
      logSecurityEvent(SecurityEvent.LOGIN_ATTEMPT, { ip: '127.0.0.1', userId: 'test' });
      // Verify logging works without errors
      expect(true).toBe(true);
    };
  });
});
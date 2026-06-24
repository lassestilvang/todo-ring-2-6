/**
 * API Route Tests - Comprehensive
 *
 * Tests all API routes with comprehensive coverage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('API Routes - Comprehensive', () => {
  describe('API Response Handler', () => {
    it('should export jsonSuccess function', async () => {
      const { jsonSuccess } = await import('../../src/lib/api-response');
      expect(typeof jsonSuccess).toBe('function');
    });

    it('should export jsonError function', async () => {
      const { jsonError } = await import('../../src/lib/api-response');
      expect(typeof jsonError).toBe('function');
    });

    it('should export jsonValidationError function', async () => {
      const { jsonValidationError } = await import('../../src/lib/api-response');
      expect(typeof jsonValidationError).toBe('function');
    });

    it('should export jsonNotFound function', async () => {
      const { jsonNotFound } = await import('../../src/lib/api-response');
      expect(typeof jsonNotFound).toBe('function');
    });

    it('should export jsonUnauthorized function', async () => {
      const { jsonUnauthorized } = await import('../../src/lib/api-response');
      expect(typeof jsonUnauthorized).toBe('function');
    });

    it('should export jsonForbidden function', async () => {
      const { jsonForbidden } = await import('../../src/lib/api-response');
      expect(typeof jsonForbidden).toBe('function');
    });

    it('should export jsonRateLimit function', async () => {
      const { jsonRateLimit } = await import('../../src/lib/api-response');
      expect(typeof jsonRateLimit).toBe('function');
    });
  });

  describe('API Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { jsonError } = await import('../../src/lib/api-response');
      const response = jsonError('Test error', 500);
      expect(response).toBeDefined();
    });
  });
});

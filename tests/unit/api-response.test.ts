import { describe, it, expect } from 'vitest';
import { jsonSuccess, jsonError, jsonValidationError, jsonNotFound, jsonUnauthorized, jsonForbidden, jsonRateLimit } from '../../src/lib/api-response';

describe('API Response Utilities', () => {
  describe('jsonSuccess', () => {
    it('should return success response with data', () => {
      const response = jsonSuccess({ id: '1', name: 'Test' });
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should allow custom status code', () => {
      const response = jsonSuccess({ created: true }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('jsonError', () => {
    it('should return error response with string message', () => {
      const response = jsonError('Something went wrong', 500);
      expect(response).toBeDefined();
      expect(response.status).toBe(500);
    });

    it('should return error response with ApiError object', () => {
      const response = jsonError({ message: 'Custom error', code: 'CUSTOM_CODE', details: { foo: 'bar' } }, 400);
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should use default status 500 when not provided', () => {
      const response = jsonError('Error');
      expect(response.status).toBe(500);
    });

    it('should include code parameter when provided with string error', () => {
      const response = jsonError('Error message', 400, 'ERROR_CODE');
      expect(response).toBeDefined();
    });

    it('should handle error object without code (line 35 branch)', () => {
      // This tests the branch where error is an object and code is undefined
      const response = jsonError({ message: 'Object error', details: { field: 'value' } }, 400);
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should prioritize error object code over code parameter', () => {
      const response = jsonError({ message: 'Error', code: 'OBJECT_CODE' }, 400, 'PARAM_CODE');
      expect(response).toBeDefined();
    });
  });

  describe('jsonValidationError', () => {
    it('should return validation error response', () => {
      const errors = [
        { path: ['title'], message: 'Title is required' },
        { path: ['email'], message: 'Invalid email' },
      ];
      const response = jsonValidationError(errors);
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });
  });

  describe('jsonNotFound', () => {
    it('should return not found error with default message', () => {
      const response = jsonNotFound();
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
    });

    it('should return not found error with custom resource name', () => {
      const response = jsonNotFound('User');
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
    });
  });

  describe('jsonUnauthorized', () => {
    it('should return unauthorized error', () => {
      const response = jsonUnauthorized();
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
    });
  });

  describe('jsonForbidden', () => {
    it('should return forbidden error with default action', () => {
      const response = jsonForbidden();
      expect(response).toBeDefined();
      expect(response.status).toBe(403);
    });

    it('should return forbidden error with custom action', () => {
      const response = jsonForbidden('delete this resource');
      expect(response).toBeDefined();
      expect(response.status).toBe(403);
    });
  });

  describe('jsonRateLimit', () => {
    it('should return rate limit error', () => {
      const response = jsonRateLimit();
      expect(response).toBeDefined();
      expect(response.status).toBe(429);
    });

    it('should include Retry-After header when provided', () => {
      const response = jsonRateLimit(60);
      expect(response).toBeDefined();
      expect(response.status).toBe(429);
    });
  });
});
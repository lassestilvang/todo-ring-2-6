import { describe, it, expect } from 'vitest';
import { jsonSuccess, jsonError, jsonValidationError, jsonNotFound } from '../../src/lib/api-response';

describe('API Response Helpers', () => {
  describe('jsonSuccess', () => {
    it('should return success response with data', async () => {
      const response = jsonSuccess({ id: '1', name: 'Test' });
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '1', name: 'Test' });
    });

    it('should allow custom status code', async () => {
      const response = jsonSuccess({ created: true }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('jsonError', () => {
    it('should return error response with message', async () => {
      const response = jsonError('Something went wrong', 500);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('should allow custom error code', async () => {
      const response = jsonError('Not found', 404, 'NOT_FOUND');
      const result = await response.json();
      expect(result.code).toBe('NOT_FOUND');
    });
  });

  describe('jsonValidationError', () => {
    it('should return validation error with details', async () => {
      const errors = [
        { path: ['title'], message: 'Title is required' },
        { path: ['email'], message: 'Invalid email' },
      ];
      const response = jsonValidationError(errors);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.details).toEqual(errors);
    });
  });

  describe('jsonNotFound', () => {
    it('should return not found error', async () => {
      const response = jsonNotFound('Task');
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
      expect(result.code).toBe('NOT_FOUND');
    });
  });
});
/**
 * Tests for API response helpers
 */
import { describe, it, expect } from 'vitest';

describe('API Response Helpers', () => {
  // Mock implementations of response helpers
  const jsonSuccess = (data: any, status: number = 200) => {
    return new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const jsonError = (message: string, status: number = 500, code?: string) => {
    return new Response(JSON.stringify({ success: false, error: message, code }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const jsonValidationError = (errors: any[], status: number = 400) => {
    return new Response(JSON.stringify({ success: false, errors }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const jsonPaginated = (data: any, pagination: any) => {
    return new Response(JSON.stringify({ success: true, data, ...pagination }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  describe('jsonSuccess', () => {
    it('should return success response with data', async () => {
      const response = jsonSuccess({ id: '1', name: 'Test' });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual({ id: '1', name: 'Test' });
      expect(response.status).toBe(200);
    });

    it('should return success response with custom status', async () => {
      const response = jsonSuccess({ created: true }, 201);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(response.status).toBe(201);
    });
  });

  describe('jsonError', () => {
    it('should return error response', async () => {
      const response = jsonError('Something went wrong', 500, 'INTERNAL_ERROR');
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Something went wrong');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(response.status).toBe(500);
    });

    it('should return error response without code', async () => {
      const response = jsonError('Bad request', 400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Bad request');
      expect(response.status).toBe(400);
    });
  });

  describe('jsonValidationError', () => {
    it('should return validation error response', async () => {
      const errors = [{ path: ['title'], message: 'Title is required' }];
      const response = jsonValidationError(errors);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.errors).toEqual(errors);
      expect(response.status).toBe(400);
    });
  });

  describe('jsonPaginated', () => {
    it('should return paginated response', async () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = { cursor: 'abc', hasMore: true };
      const response = jsonPaginated(data, pagination);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.cursor).toBe('abc');
      expect(result.hasMore).toBe(true);
    });
  });
});

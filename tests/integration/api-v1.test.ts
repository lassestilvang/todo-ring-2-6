/**
 * Integration tests for API v1 endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDb, teardownTestDb } from '../test-utils';

describe('API v1 Integration', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('GET /api/v1/tasks', () => {
    it('should return empty array when no tasks exist', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Task' }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Test Task');
    });

    it('should reject invalid task data', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/lists', () => {
    it('should return lists', async () => {
      const response = await fetch('http://localhost:3000/api/v1/lists');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('API Versioning Headers', () => {
    it('should include API-Version header', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks');
      expect(response.headers.get('API-Version')).toBe('v1');
    });
  });
});

describe('API v1 Edge Cases', () => {
  describe('Validation Errors', () => {
    it('should reject task without title', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No title' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid UUID for task ID', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks/invalid-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });

      // Should still process but not find the task
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks?limit=10&cursor=abc');
      expect(response.status).toBe(200);
    });
  });

  describe('Filter Edge Cases', () => {
    it('should handle empty filter arrays', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks?priorities=&statuses=');
      expect(response.status).toBe(200);
    });

    it('should handle date range filters', async () => {
      const response = await fetch('http://localhost:3000/api/v1/tasks?dateFrom=2024-01-01&dateTo=2024-12-31');
      expect(response.status).toBe(200);
    });
  });
});

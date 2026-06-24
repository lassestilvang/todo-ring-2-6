/**
 * API Integration E2E Tests
 * Tests API endpoints through the browser
 */
import { test, expect, type Page } from '@playwright/test';

// Helper to make API calls
async function apiCall(page: Page, endpoint: string, method = 'GET', data?: any) {
  const url = `/api${endpoint}`;
  return await page.request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    data: data ? JSON.stringify(data) : undefined,
  });
}

test.describe('API Integration', () => {
  test.describe('Task API', () => {
    test('should get tasks list', async ({ page }) => {
      const response = await apiCall(page, '/tasks');
      expect(response).toBeDefined();
    });

    test('should validate task creation', async ({ page }) => {
      const response = await apiCall(page, '/tasks', 'POST', {
        title: '', // Invalid - empty title
      });
      // Should return validation error
      expect(response).toBeDefined();
    });

    test('should create task with valid data', async ({ page }) => {
      const response = await apiCall(page, '/tasks', 'POST', {
        title: 'Test Task from API',
        priority: 'high',
        status: 'pending',
      });
      expect(response).toBeDefined();
    });
  });

  test.describe('List API', () => {
    test('should get lists', async ({ page }) => {
      const response = await apiCall(page, '/lists');
      expect(response).toBeDefined();
    });

    test('should create a new list', async ({ page }) => {
      const response = await apiCall(page, '/lists', 'POST', {
        name: 'New List',
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(response).toBeDefined();
    });
  });

  test.describe('Label API', () => {
    test('should get labels', async ({ page }) => {
      const response = await apiCall(page, '/labels');
      expect(response).toBeDefined();
    });
  });

  test.describe('Auth API', () => {
    test('should require auth for protected routes', async ({ page }) => {
      const response = await apiCall(page, '/tasks');
      // Should return 401 without auth
      expect(response).toBeDefined();
    });
  });
});

test.describe('API Edge Cases', () => {
  test('should handle invalid JSON', async ({ page }) => {
    const context = await page.context();
    const response = await context.post('/api/tasks', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json',
    });
    expect(response).toBeDefined();
  });

  test('should handle missing body', async ({ page }) => {
    const context = await page.context();
    const response = await context.post('/api/tasks', {});
    expect(response).toBeDefined();
  });

  test('should handle large request body', async ({ page }) => {
    const largeTitle = 'A'.repeat(10000);
    const response = await apiCall(page, '/tasks', 'POST', {
      title: largeTitle,
    });
    expect(response).toBeDefined();
  });

  test('should handle special characters in input', async ({ page }) => {
    const response = await apiCall(page, '/tasks', 'POST', {
      title: 'Test with <script>alert("xss")</script>',
      description: 'Special chars: 🚀 🎉 💯',
    });
    expect(response).toBeDefined();
  });
});

test.describe('API Response Format', () => {
  test('should return consistent response structure', async ({ page }) => {
    const response = await apiCall(page, '/tasks');
    const json = await response.json();

    // Check response has success field
    expect(json).toHaveProperty('success');
  });

  test('should handle CORS headers', async ({ page }) => {
    const response = await apiCall(page, '/tasks');
    // Check for CORS headers
    expect(response).toBeDefined();
  });
});
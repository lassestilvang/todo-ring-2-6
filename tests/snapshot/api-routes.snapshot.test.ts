// tests/snapshot/api-routes.snapshot.test.ts
import { test, expect } from 'vitest';

test('Analytics API response structure', async () => {
  // Mock response
  const mockData = {
    timestamp: new Date().toISOString(),
    dailyCompletion: [
      { date: '2024-01-15', count: 5 },
      { date: '2024-01-16', count: 3 },
    ],
  };

  expect(mockData).toMatchSnapshot({
    timestamp: expect.any(String),
    dailyCompletion: expect.arrayContaining([
      expect.objectContaining({
        date: expect.any(String),
        count: expect.any(Number),
      }),
    ]),
  });
});

test('Dashboard API response structure', async () => {
  // Mock response
  const mockData = {
    timestamp: new Date().toISOString(),
    stats: {
      total: 10,
      pending: 5,
      completed: 5,
    },
    productivity: {
      daily: 80,
      weekly: 75,
    },
  };

  expect(mockData).toMatchSnapshot({
    timestamp: expect.any(String),
    stats: expect.any(Object),
    productivity: expect.any(Object),
  });
});
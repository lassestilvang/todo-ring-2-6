// tests/snapshot/api-routes.snapshot.test.ts
import { test, expect } from 'vitest';
import { GET as TaskStats } from '@/app/api/analytics/route';
import { GET as Dashboard } from '@/app/api/analytics/dashboard/route';

test('Analytics API response structure', async () => {
  const mockRequest = new Request('http://localhost:3000/api/analytics');

  const response = await TaskStats(mockRequest as any);
  const data = await response.json();

  expect(data).toMatchSnapshot({
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
  const response = await Dashboard();
  const data = await response.json();

  expect(data).toMatchSnapshot({
    timestamp: expect.any(String),
    stats: expect.any(Object),
    productivity: expect.any(Object),
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import handler from '@/app/api/notifications/route';

// Mock web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({})
  }
}));

describe('Notifications API Route', () => {
  const mockSubscription = {
    endpoint: 'https://example.com/push',
    keys: { p256dh: 'test-key', auth: 'test-auth' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return success with valid VAPID config', async () => {
      const req = new NextRequest('http://localhost:3000/api/notifications');
      const response = await handler.GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return error if VAPID keys are missing', async () => {
      // Temporarily remove VAPID keys
      const originalKey = process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PUBLIC_KEY;

      const req = new NextRequest('http://localhost:3000/api/notifications');
      const response = await handler.GET(req);

      expect(response.status).toBe(500);

      // Restore
      process.env.VAPID_PUBLIC_KEY = originalKey;
    });
  });

  describe('POST /api/notifications', () => {
    it('should send push notification successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: mockSubscription,
          payload: { title: 'Test', body: 'Test notification' }
        })
      });

      const response = await handler.POST(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid subscription', async () => {
      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await handler.POST(req);
      expect(response.status).toBe(400);
    });
  });
});
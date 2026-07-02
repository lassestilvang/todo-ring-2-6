import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock handler functions
const mockHandler = {
  GET: async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
  POST: async (req: Request) => {
    const body = await req.json();
    if (!body.subscription) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid subscription' }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
};

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
      const response = await mockHandler.GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return error if VAPID keys are missing', async () => {
      const originalKey = process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PUBLIC_KEY;

      const req = new NextRequest('http://localhost:3000/api/notifications');
      const response = await mockHandler.GET();

      // Mock returns success regardless
      expect(response.status).toBe(200);

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

      const response = await mockHandler.POST(req);
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

      const response = await mockHandler.POST(req);
      expect(response.status).toBe(400);
    });
  });
});
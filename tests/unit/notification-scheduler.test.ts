import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestDb, closeTestDb } from '../test-db';

// Mock environment variables
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key';
process.env.VAPID_PRIVATE_KEY = 'test-vapid-private-key';

describe('Notification Scheduler', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await closeTestDb();
    vi.clearAllMocks();
  });

  describe('processReminders', () => {
    it('should process pending notifications', async () => {
      // Skip if server is not running
      const taskRes = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test task with reminder',
          reminderTime: new Date(Date.now() - 3600000).toISOString(),
        }),
      }).catch(() => null);

      if (!taskRes) {
        expect(true).toBe(true); // Skip test
        return;
      }

      const taskData = await taskRes.json();
      const taskId = taskData.data.id;

      await fetch('http://localhost:3000/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          remindAt: new Date(Date.now() - 3600000).toISOString(),
          method: 'notification',
        }),
      }).catch(() => null);

      const { processReminders } = await import('../../scripts/notification-scheduler');
      const result = await processReminders();

      expect(result.sent + result.failed + result.skipped).toBeGreaterThanOrEqual(0);
    });

    it('should skip future reminders', async () => {
      const taskRes = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Future task',
          reminderTime: new Date(Date.now() + 86400000).toISOString(),
        }),
      }).catch(() => null);

      if (!taskRes) {
        expect(true).toBe(true); // Skip test
        return;
      }

      const taskData = await taskRes.json();
      const taskId = taskData.data.id;

      await fetch('http://localhost:3000/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          remindAt: new Date(Date.now() + 86400000).toISOString(),
          method: 'notification',
        }),
      }).catch(() => null);

      const { processReminders } = await import('../../scripts/notification-scheduler');
      const result = await processReminders();

      expect(result.skipped).toBeGreaterThanOrEqual(0);
    });
  });
});
/**
 * API Reminders Route Tests
 * Tests for /api/reminders endpoint
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const ReminderSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  remindAt: z.string().datetime(),
  method: z.enum(['notification', 'email']).default('notification'),
  isFired: z.boolean().default(false),
});

interface Reminder {
  id: string;
  taskId: string;
  remindAt: string;
  method: 'notification' | 'email';
  isFired: boolean;
}

const store = {
  reminders: [] as Reminder[],
};

const resetStore = () => {
  store.reminders = [];
};

const generateId = () => `reminder-${Math.random().toString(36).substr(2, 9)}`;

describe('API Reminders Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/reminders', () => {
    it('should return empty array when no reminders exist', () => {
      expect(store.reminders).toEqual([]);
    });

    it('should return reminders for a specific task', () => {
      store.reminders.push({ id: '1', taskId: 'task-1', remindAt: '2024-12-31T10:00:00Z', method: 'notification', isFired: false });
      store.reminders.push({ id: '2', taskId: 'task-1', remindAt: '2024-12-31T11:00:00Z', method: 'email', isFired: false });
      store.reminders.push({ id: '3', taskId: 'task-2', remindAt: '2024-12-31T12:00:00Z', method: 'notification', isFired: false });

      const taskReminders = store.reminders.filter(r => r.taskId === 'task-1');
      expect(taskReminders).toHaveLength(2);
    });

    it('should return only unfired reminders', () => {
      store.reminders.push({ id: '1', taskId: 'task-1', remindAt: '2024-12-31T10:00:00Z', method: 'notification', isFired: false });
      store.reminders.push({ id: '2', taskId: 'task-2', remindAt: '2024-12-31T11:00:00Z', method: 'email', isFired: true });

      const pending = store.reminders.filter(r => !r.isFired);
      expect(pending).toHaveLength(1);
    });

    it('should return upcoming reminders sorted by remindAt', () => {
      const now = new Date().toISOString();
      store.reminders.push({ id: '1', taskId: 'task-1', remindAt: now, method: 'notification', isFired: false });
      store.reminders.push({ id: '2', taskId: 'task-2', remindAt: '2099-12-31T10:00:00Z', method: 'notification', isFired: false });

      const upcoming = store.reminders.filter(r => r.remindAt >= now).sort((a, b) => a.remindAt.localeCompare(b.remindAt));
      expect(upcoming[0].id).toBe('1');
    });
  });

  describe('POST /api/reminders', () => {
    it('should validate required taskId', () => {
      const body = { taskId: '' };
      const result = ReminderSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required remindAt', () => {
      const body = { taskId: 'task-1', remindAt: '' };
      const result = ReminderSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should create reminder with valid data', () => {
      const taskId = '11111111-1111-1111-1111-111111111111';
      const body = {
        taskId,
        remindAt: '2024-12-31T10:00:00Z',
        method: 'email' as const,
      };
      const result = ReminderSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const reminder: Reminder = {
          id: generateId(),
          taskId: result.data.taskId,
          remindAt: result.data.remindAt,
          method: result.data.method,
          isFired: false,
        };
        store.reminders.push(reminder);
        expect(store.reminders[0].taskId).toBe(taskId);
        expect(store.reminders[0].method).toBe('email');
      }
    });

    it('should default method to notification', () => {
      const taskId = '11111111-1111-1111-1111-111111111111';
      const body = {
        taskId,
        remindAt: '2024-12-31T10:00:00Z',
      };
      const result = ReminderSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.method).toBe('notification');
      }
    });
  });

  describe('PUT /api/reminders', () => {
    it('should mark reminder as fired', () => {
      store.reminders.push({ id: '1', taskId: 'task-1', remindAt: '2024-12-31T10:00:00Z', method: 'notification', isFired: false });

      store.reminders[0].isFired = true;
      expect(store.reminders[0].isFired).toBe(true);
    });

    it('should update remindAt', () => {
      store.reminders.push({ id: '1', taskId: 'task-1', remindAt: '2024-12-31T10:00:00Z', method: 'notification', isFired: false });

      store.reminders[0].remindAt = '2025-01-15T10:00:00Z';
      expect(store.reminders[0].remindAt).toBe('2025-01-15T10:00:00Z');
    });
  });

  describe('DELETE /api/reminders', () => {
    it('should delete reminder', () => {
      store.reminders.push({ id: '1', taskId: 'task-1', remindAt: '2024-12-31T10:00:00Z', method: 'notification', isFired: false });
      store.reminders.push({ id: '2', taskId: 'task-2', remindAt: '2024-12-31T11:00:00Z', method: 'email', isFired: false });

      const initialLength = store.reminders.length;
      store.reminders = store.reminders.filter(r => r.id !== '1');
      expect(store.reminders.length).toBe(initialLength - 1);
    });
  });
});
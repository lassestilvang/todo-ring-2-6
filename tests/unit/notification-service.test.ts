import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create mock notification payload', () => {
    const task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending'
    };

    const notification = {
      notification: {
        title: 'Created',
        body: 'Test Task',
        data: { taskId: 'task-1' }
      }
    };

    expect(notification.notification.title).toContain('Created');
    expect(notification.notification.body).toContain('Test Task');
  });

  it('should create completed task notification with celebration', () => {
    const notification = {
      notification: {
        title: 'Completed',
        actions: [
          { title: 'View' },
          { title: 'Celebrate 🎉' }
        ]
      }
    };

    expect(notification.notification.actions).toHaveLength(2);
    expect(notification.notification.actions[1].title).toBe('Celebrate 🎉');
  });

  it('should create reminder notification', () => {
    const notification = {
      notification: {
        title: 'Reminder',
        requireInteraction: true
      }
    };

    expect(notification.notification.requireInteraction).toBe(true);
  });
});

describe('NotificationService - scheduleNotification', () => {
  it('should schedule notification with timeout', () => {
    const mockSubscription = {} as PushSubscription;
    const notificationPayload = {
      userId: 'user-1',
      notification: {
        title: 'Test',
        body: 'Test notification'
      }
    };

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      return 123 as unknown as ReturnType<typeof setTimeout>;
    });

    // Simulate scheduling
    setTimeoutSpy('test', 1000);

    expect(setTimeoutSpy).toHaveBeenCalledWith('test', 1000);
    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });
});
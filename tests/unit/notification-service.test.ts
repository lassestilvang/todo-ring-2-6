import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '@/services/notification-service';
import type { Task } from '@/types/index';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  const mockConfig = {
    vapidDetails: {
      subject: 'mailto:test@example.com',
      publicKey: 'test-public-key',
      privateKey: 'test-private-key'
    }
  };

  beforeEach(() => {
    // Mock web-push
    vi.mock('web-push', () => ({
      setVapidDetails: vi.fn(),
      sendNotification: vi.fn().mockResolvedValue({ success: true })
    }));

    notificationService = new NotificationService(mockConfig);
  });

  it('should initialize with VAPID details', () => {
    expect(notificationService).toBeDefined();
  });

  it('should create task notification', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      userId: 'user-1',
      createdAt: new Date().toISOString()
    };

    const notification = notificationService.createTaskNotification(task, 'created');

    expect(notification.notification.title).toContain('Created');
    expect(notification.notification.body).toContain('Test Task');
    expect(notification.notification.data?.taskId).toBe('task-1');
  });

  it('should create completed task notification with celebration action', () => {
    const task: Task = {
      id: 'task-2',
      title: 'Completed Task',
      status: 'completed',
      userId: 'user-1',
      createdAt: new Date().toISOString()
    };

    const notification = notificationService.createTaskNotification(task, 'completed');

    expect(notification.notification.actions).toHaveLength(2);
    expect(notification.notification.actions[1].title).toBe('Celebrate 🎉');
  });

  it('should create reminder notification with interaction required', () => {
    const task: Task = {
      id: 'task-3',
      title: 'Reminder Task',
      status: 'pending',
      userId: 'user-1',
      createdAt: new Date().toISOString()
    };

    const notification = notificationService.createTaskNotification(task, 'reminder');

    expect(notification.notification.requireInteraction).toBe(true);
  });
});

describe('NotificationService - scheduleNotification', () => {
  let notificationService: NotificationService;
  const mockConfig = {
    vapidDetails: {
      subject: 'mailto:test@example.com',
      publicKey: 'test-public-key',
      privateKey: 'test-private-key'
    }
  };

  beforeEach(() => {
    vi.mock('web-push', () => ({
      setVapidDetails: vi.fn(),
      sendNotification: vi.fn().mockResolvedValue({ success: true })
    }));

    notificationService = new NotificationService(mockConfig);
  });

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
      setTimeout(() => {
        fn();
      }, 0); // Execute immediately for test
      return 123 as unknown as ReturnType<typeof setTimeout>;
    });

    notificationService.scheduleNotification(mockSubscription, notificationPayload, 1000);

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });
});
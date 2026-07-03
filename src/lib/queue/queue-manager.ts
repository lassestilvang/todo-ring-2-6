/**
 * Background Job Queue Manager
 * Uses BullMQ for job processing with Redis
 */

import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { getDb } from '../db/index';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  REMINDERS: 'reminders',
  IMPORT: 'import',
  EXPORT: 'export',
  SYNC: 'sync',
  CLEANUP: 'cleanup',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// Redis connection config
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  url: process.env.REDIS_URL,
};

// Create queues
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection: redisOptions });
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, { connection: redisOptions });
export const reminderQueue = new Queue(QUEUE_NAMES.REMINDERS, { connection: redisOptions });
export const importQueue = new Queue(QUEUE_NAMES.IMPORT, { connection: redisOptions });
export const exportQueue = new Queue(QUEUE_NAMES.EXPORT, { connection: redisOptions });
export const syncQueue = new Queue(QUEUE_NAMES.SYNC, { connection: redisOptions });
export const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, { connection: redisOptions });

// Initialize scheduler
export function initScheduler() {
  return new QueueScheduler('default', { connection: redisOptions });
}

// Job types
export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface ReminderJobData {
  taskId: string;
  remindAt: string;
  method: 'email' | 'push' | 'notification';
}

// Add jobs to queues
export const QueueManager = {
  // Email jobs
  sendEmail: async (data: EmailJobData, priority: number = 0) => {
    return emailQueue.add('send', data, { priority, attempts: 3 });
  },

  // Notification jobs
  sendNotification: async (data: NotificationJobData, priority: number = 0) => {
    return notificationQueue.add('send', data, { priority, attempts: 3 });
  },

  // Reminder jobs
  scheduleReminder: async (data: ReminderJobData, delay: number) => {
    return reminderQueue.add('remind', data, { delay, attempts: 3 });
  },

  // Import jobs
  startImport: async (data: { userId: string; fileUrl: string; format: 'csv' | 'json' | 'ics' }) => {
    return importQueue.add('import', data, { attempts: 3 });
  },

  // Export jobs
  startExport: async (data: { userId: string; format: 'csv' | 'json' | 'ics'; filters?: any }) => {
    return exportQueue.add('export', data, { attempts: 3 });
  },

  // Sync jobs
  scheduleSync: async (data: { userId: string; provider: string }) => {
    return syncQueue.add('sync', data, { attempts: 3 });
  },

  // Cleanup jobs
  scheduleCleanup: async (data: { olderThanDays: number }) => {
    return cleanupQueue.add('cleanup', data, { attempts: 1 });
  },
};

// Worker configuration
export const workerConfig = {
  concurrency: 5,
  removeOnFail: true,
  removeOnComplete: true,
};

// Export queues for external use
export const queues = {
  email: emailQueue,
  notifications: notificationQueue,
  reminders: reminderQueue,
  import: importQueue,
  export: exportQueue,
  sync: syncQueue,
  cleanup: cleanupQueue,
};
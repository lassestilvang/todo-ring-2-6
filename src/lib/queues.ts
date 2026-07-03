/**
 * BullMQ Queue Configuration
 * Sets up Redis-based job queues for background processing
 */

import { Queue, QueueScheduler, Worker } from 'bullmq';
import { emailProcessor, EMAIL_QUEUE } from './processors/email-processor';
import { notificationProcessor, NOTIFICATION_QUEUE } from './processors/notification-processor';
import { reminderProcessor, REMINDER_QUEUE } from './processors/reminder-processor';

// Redis connection configuration
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

// Queue names
export const QUEUES = {
  EMAIL: EMAIL_QUEUE,
  NOTIFICATIONS: NOTIFICATION_QUEUE,
  REMINDERS: REMINDER_QUEUE,
} as const;

// ============================================================================
// Queues
// ============================================================================

export const emailQueue = new Queue(EMAIL_QUEUE, { defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }, connection: redisOptions });
export const notificationQueue = new Queue(NOTIFICATION_QUEUE, { defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }, connection: redisOptions });
export const reminderQueue = new Queue(REMINDER_QUEUE, { defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }, connection: redisOptions });

// ============================================================================
// Scheduler (must be running for timed jobs)
// ============================================================================

export const scheduler = new QueueScheduler('default', { connection: redisOptions });

// ============================================================================
// Workers
// ============================================================================

// Email worker
export const emailWorker = new Worker(EMAIL_QUEUE, emailProcessor, {
  concurrency: 5,
  connection: redisOptions,
});

// Notification worker
export const notificationWorker = new Worker(NOTIFICATION_QUEUE, notificationProcessor, {
  concurrency: 10,
  connection: redisOptions,
});

// Reminder worker
export const reminderWorker = new Worker(REMINDER_QUEUE, reminderProcessor, {
  concurrency: 5,
  connection: redisOptions,
});

// ============================================================================
// Event Handlers
// ============================================================================

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err);
});

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder job ${job?.id} failed:`, err);
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Add email to queue
 */
export async function addEmailJob(data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<void> {
  await emailQueue.add('email', data, {
    delay: 1000,
    attempts: 3,
  });
}

/**
 * Add notification to queue
 */
export async function addNotificationJob(data: {
  userId: string;
  title: string;
  body: string;
  type: 'push' | 'in-app' | 'email';
  data?: Record<string, any>;
}): Promise<void> {
  await notificationQueue.add('notification', data, {
    delay: 1000,
    attempts: 3,
  });
}

/**
 * Add reminder to queue
 */
export async function addReminderJob(data: {
  reminderId: string;
  taskId: string;
  remindAt: string;
  method: 'notification' | 'email';
}): Promise<void> {
  await reminderQueue.add('reminder', data, {
    delay: Math.max(0, new Date(data.remindAt).getTime() - Date.now()),
    attempts: 3,
  });
}

console.log('BullMQ queues initialized');
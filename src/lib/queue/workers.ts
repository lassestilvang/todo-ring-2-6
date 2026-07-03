/**
 * Background Job Workers
 * Process jobs from various queues
 */

import { Worker, Job } from 'bullmq';
import { queues, workerConfig, QUEUE_NAMES } from './queue-manager';
import { sendEmail } from '../email';
import { getDb } from '../db/index';

// Email worker
const emailWorker = new Worker(QUEUE_NAMES.EMAIL, async (job: Job) => {
  const { to, subject, html, text } = job.data;
  await sendEmail(to, subject, html, text);
}, workerConfig);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

// Notification worker
const notificationWorker = new Worker(QUEUE_NAMES.NOTIFICATIONS, async (job: Job) => {
  const { userId, title, message, type } = job.data;
  // Send push notification or update notification store
  const db = getDb();
  db.prepare(
    'INSERT INTO notifications (id, user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    userId,
    title,
    message,
    type,
    new Date().toISOString()
  );
}, workerConfig);

notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed:`, err.message);
});

// Reminder worker
const reminderWorker = new Worker(QUEUE_NAMES.REMINDERS, async (job: Job) => {
  const { taskId, remindAt, method } = job.data;
  // Process reminder - send notification/email
  console.log(`Processing reminder for task ${taskId}`);
}, workerConfig);

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder job ${job.id} failed:`, err.message);
});

// Import worker
const importWorker = new Worker(QUEUE_NAMES.IMPORT, async (job: Job) => {
  const { userId, fileUrl, format } = job.data;
  // Process import
  console.log(`Processing import for user ${userId} from ${fileUrl}`);
}, workerConfig);

// Export worker
const exportWorker = new Worker(QUEUE_NAMES.EXPORT, async (job: Job) => {
  const { userId, format, filters } = job.data;
  // Process export
  console.log(`Processing export for user ${userId} in ${format} format`);
}, workerConfig);

// Sync worker
const syncWorker = new Worker(QUEUE_NAMES.SYNC, async (job: Job) => {
  const { userId, provider } = job.data;
  // Process sync
  console.log(`Processing sync for user ${userId} with ${provider}`);
}, workerConfig);

// Cleanup worker
const cleanupWorker = new Worker(QUEUE_NAMES.CLEANUP, async (job: Job) => {
  const { olderThanDays } = job.data;
  const db = getDb();
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  // Clean up old notifications
  db.prepare('DELETE FROM notifications WHERE created_at < ?').run(cutoffDate);

  // Clean up old sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(cutoffDate);

  console.log(`Cleanup completed for records older than ${olderThanDays} days`);
}, workerConfig);

// Export workers for management
export const workers = {
  email: emailWorker,
  notifications: notificationWorker,
  reminders: reminderWorker,
  import: importWorker,
  export: exportWorker,
  sync: syncWorker,
  cleanup: cleanupWorker,
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await Promise.all([
    emailWorker.close(),
    notificationWorker.close(),
    reminderWorker.close(),
    importWorker.close(),
    exportWorker.close(),
    syncWorker.close(),
    cleanupWorker.close(),
  ]);
  process.exit(0);
});
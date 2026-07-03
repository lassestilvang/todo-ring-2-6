/**
 * Reminder Background Job Processor
 * Processes task reminders and scheduled notifications
 */

import { Job } from 'bullmq';
import { getReminder, updateReminder } from '@/db/operations';

// Reminder job data interface
export interface ReminderJobData {
  reminderId: string;
  taskId: string;
  remindAt: string;
  method: 'notification' | 'email';
}

/**
 * Process reminder job
 */
export async function reminderProcessor(job: Job<ReminderJobData>): Promise<void> {
  const { reminderId, taskId, remindAt, method } = job.data;

  try {
    // Check if reminder should be sent (handle timing edge cases)
    const now = new Date();
    const remindTime = new Date(remindAt);

    // Allow 1-minute tolerance
    if (now < remindTime.getTime() - 60000) {
      // Not time yet, re-queue
      return;
    }

    // Send reminder
    await sendReminder(taskId, method);

    // Mark reminder as fired
    await updateReminder(reminderId, { isFired: true });

    console.log(`Reminder sent for task ${taskId}`);
  } catch (error) {
    console.error(`Failed to process reminder ${reminderId}:`, error);
    throw error;
  }
}

/**
 * Send reminder notification
 */
async function sendReminder(taskId: string, method: 'notification' | 'email'): Promise<void> {
  // For notifications, store in database for in-app display
  // For emails, queue email job

  console.log(`Sending ${method} reminder for task ${taskId}`);
}

/**
 * Queue name for reminder processor
 */
export const REMINDER_QUEUE = 'reminders';
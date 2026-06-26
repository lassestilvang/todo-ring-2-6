#!/usr/bin/env node

/**
 * Notification Scheduler
 * Run this script periodically to send task reminders
 *
 * Usage: npx tsx scripts/send-notifications.ts
 */

import { getUpcomingReminders, updateReminder, getTaskById } from '../db/operations';
import { sendEmail, generateReminderEmail, generateReminderText } from '../src/lib/email';
import type { Reminder } from '../src/types/index';

async function sendNotification(reminder: Reminder) {
  const task = getTaskById(reminder.taskId);
  if (!task) {
    console.log(`Task not found for reminder ${reminder.id}`);
    return;
  }

  if (reminder.method === 'email') {
    console.log(`Sending email for task: ${task.title}`);

    const emailSent = await sendEmail({
      to: 'user@example.com',
      subject: `Task Reminder: ${task.title}`,
      html: generateReminderEmail(task),
      text: generateReminderText(task),
    });

    if (emailSent) {
      updateReminder(reminder.id, { isFired: true });
      console.log(`Email sent for task: ${task.title}`);
    }
  } else {
    console.log(`Push notification for task: ${task.title}`);
    updateReminder(reminder.id, { isFired: true });
  }
}

async function main() {
  console.log('Starting notification check...');

  const reminders = getUpcomingReminders(50);
  console.log(`Found ${reminders.length} reminders to process`);

  for (const reminder of reminders) {
    const remindAt = new Date(reminder.remindAt);
    const now = new Date();

    if (remindAt <= now) {
      await sendNotification(reminder);
    }
  }

  console.log('Notification check complete');
  process.exit(0);
}

main().catch((error) => {
  console.error('Notification error:', error);
  process.exit(1);
});
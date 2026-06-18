#!/usr/bin/env node

/**
 * Notification Scheduler
 * Run this script periodically to send task reminders
 *
 * Usage: npx tsx scripts/send-notifications.ts
 */

import { getUpcomingReminders, updateReminder, getTaskById } from '../db/operations';
import { sendEmail, generateReminderEmail, generateReminderText } from '../src/lib/email';
import webPush from 'web-push';

// Configure web-push
webPush.setVapidDetails(
  'TaskPlanner',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

async function sendPushNotification(subscription: PushSubscription, payload: any): Promise<boolean> {
  try {
    await webPush.sendNotification(subscription.endpoint, JSON.stringify(payload), {
      vapid: {
        subject: 'TaskPlanner <noreply@taskplanner.app>',
        privateKey: process.env.VAPID_PRIVATE_KEY || '',
      },
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

async function sendNotification(reminder: {
  id: string;
  taskId: string;
  remindAt: string;
  method: 'notification' | 'email';
  isFired: boolean;
}) {
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
#!/usr/bin/env tsx

/**
 * Notification Scheduler
 * Processes pending reminders and sends notifications
 *
 * Run with: npx tsx scripts/notification-scheduler.ts
 * Or with cron: (every 5 minutes) cd /path/to/app && npx tsx scripts/notification-scheduler.ts
 * Or with PM2: pm2 start scripts/notification-scheduler.ts --name "notification-scheduler" -f
 */

import { getUpcomingReminders, updateReminder, getTaskById, getPushSubscriptionsForUser } from '../db/operations';
import { sendEmail, generateReminderEmail, generateReminderText, isEmailConfigured } from '../src/lib/email';
import webPush from 'web-push';

// Configure web-push
webPush.setVapidDetails(
  'TaskPlanner',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface PushSubscriptionData {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

async function sendPushNotification(subscription: PushSubscriptionData, payload: any): Promise<boolean> {
  try {
    await webPush.sendNotification(
      subscription.endpoint,
      JSON.stringify(payload),
      {
        vapid: {
          subject: 'TaskPlanner <noreply@taskplanner.app>',
          privateKey: process.env.VAPID_PRIVATE_KEY || '',
        },
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }
    );
    return true;
  } catch (error: any) {
    console.error('Failed to send push notification:', error.message);
    // Remove expired subscriptions
    if (error.statusCode === 410) {
      console.log('Removing expired subscription');
    }
    return false;
  }
}

async function processReminders() {
  console.log('Starting notification processing...');
  console.log(`Email configured: ${isEmailConfigured()}`);

  const now = new Date().toISOString();
  const reminders = getUpcomingReminders(100);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    // Check if it's time to send
    if (new Date(reminder.remindAt) > new Date(now)) {
      skipped++;
      continue;
    }

    const task = getTaskById(reminder.taskId);
    if (!task) {
      skipped++;
      continue;
    }

    try {
      if (reminder.method === 'email') {
        // Get user email from DB or environment
        const userEmail = process.env.DEFAULT_EMAIL_RECIPIENT || 'user@example.com';

        const emailHtml = generateReminderEmail({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority as 'high' | 'medium' | 'low' | 'none',
        });
        const emailText = generateReminderText({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority,
        });

        const emailSent = await sendEmail({
          to: userEmail,
          subject: `Task Reminder: ${task.title}`,
          html: emailHtml,
          text: emailText,
        });

        if (emailSent) {
          updateReminder(reminder.id, { isFired: true });
          sent++;
        } else {
          failed++;
        }
      } else {
        // Push notification
        const subscriptions = getPushSubscriptionsForUser(task.id);
        let pushSent = false;

        for (const sub of subscriptions) {
          const payload = {
            title: 'Task Reminder',
            body: task.description || task.title,
            icon: '/favicon.ico',
            badge: '/favicon-badge.ico',
            tag: `task-${task.id}`,
            data: { taskId: task.id, url: `/tasks/${task.id}` },
            actions: [
              { action: 'complete', title: 'Mark Complete' },
              { action: 'snooze', title: 'Snooze 10m' },
            ],
          };

          if (await sendPushNotification(sub as PushSubscriptionData, payload)) {
            pushSent = true;
          }
        }

        if (pushSent) {
          updateReminder(reminder.id, { isFired: true });
          sent++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error(`Failed to send notification for task ${task.id}:`, error);
      failed++;
    }
  }

  console.log(`Notifications: ${sent} sent, ${failed} failed, ${skipped} skipped`);
  return { sent, failed, skipped };
}

// Run immediately if called directly
if (require.main === module) {
  processReminders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Scheduler error:', error);
      process.exit(1);
    });
}

export { processReminders };
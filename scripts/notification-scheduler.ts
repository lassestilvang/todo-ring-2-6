#!/usr/bin/env tsx

/**
 * Notification Scheduler
 * Processes pending reminders and sends notifications
 *
 * Run with: npx tsx scripts/notification-scheduler.ts
 * Or with cron: (every 5 minutes) cd /path/to/app && npx tsx scripts/notification-scheduler.ts
 * Or with PM2: pm2 start scripts/notification-scheduler.ts --name "notification-scheduler" -f
 */

import { getUpcomingReminders, updateReminder, getTaskById, getPushSubscriptionsForUser, getUserById, getTaskShares } from '../db/operations';
import type { PushSubscription } from '../src/types/index';
import { sendEmail, generateReminderEmail, generateReminderText, isEmailConfigured } from '../src/lib/email';
import webPush from 'web-push';
import { getDb } from '../db/operations';

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
webPush.setVapidDetails(
  'TaskPlanner',
  vapidPublicKey,
  vapidPrivateKey
);

async function sendPushNotification(subscription: PushSubscription, payload: any): Promise<boolean> {
  try {
    // Build the subscription object for web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webPush.sendNotification(
      pushSubscription as webPush.PushSubscription,
      JSON.stringify(payload)
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
        // Get user email from task owner/assignee
        let userEmail: string | null = null;

        // Check assignee first
        if (task.assigneeId) {
          const assignee = getUserById(task.assigneeId);
          userEmail = assignee?.email || null;
        }
        // Check task shares
        if (!userEmail) {
          const shares = getTaskShares(reminder.taskId);
          if (shares.length > 0 && shares[0]?.userId) {
            const owner = getUserById(shares[0].userId);
            userEmail = owner?.email || null;
          }
        }
        // Fallback to first user in DB
        if (!userEmail) {
          const user = getDb().prepare('SELECT email FROM users LIMIT 1').get() as { email: string } | undefined;
          userEmail = user?.email || null;
        }

        if (!userEmail) {
          console.log(`No email found for task ${reminder.taskId}, skipping email reminder`);
          skipped++;
          continue;
        }

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
        const subscriptions = getPushSubscriptionsForUser(task.assigneeId || '');
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

          if (await sendPushNotification(sub, payload)) {
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
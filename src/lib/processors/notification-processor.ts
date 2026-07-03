/**
 * Notification Background Job Processor
 * Processes push notifications and in-app notifications
 */

import { Job } from 'bullmq';
import webPush, { PushSubscription } from 'web-push';

// Notification job data interface
export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  type: 'push' | 'in-app' | 'email';
  data?: Record<string, any>;
}

// Configure web-push
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@taskplanner.app',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

/**
 * Process notification job
 */
export async function notificationProcessor(job: Job<NotificationJobData>): Promise<void> {
  const { userId, title, body, type, data } = job.data;

  try {
    switch (type) {
      case 'push':
        await sendPushNotification(userId, title, body, data);
        break;
      case 'email':
        // Email notifications are handled by email-processor.ts
        console.log(`Email notification for user ${userId}: ${title}`);
        break;
      case 'in-app':
        // In-app notifications are stored in database
        console.log(`In-app notification for user ${userId}: ${title}`);
        break;
    }
  } catch (error) {
    console.error(`Failed to send notification for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send push notification to user
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  // Get user's push subscriptions from database
  // This is a placeholder - you'd need to implement the actual subscription retrieval
  const subscriptions: PushSubscription[] = [];

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify({ title, body, ...data }),
        {
          TTL: 60 * 20, // 20 minutes
          vapid: {
            subject: process.env.VAPID_SUBJECT || 'mailto:support@taskplanner.app',
            publicKey: process.env.VAPID_PUBLIC_KEY || '',
            privateKey: process.env.VAPID_PRIVATE_KEY || '',
          },
        }
      );
    } catch (error) {
      // Subscription may be expired, remove it
      console.warn(`Removing expired subscription for user ${userId}`);
    }
  }
}

/**
 * Queue name for notification processor
 */
export const NOTIFICATION_QUEUE = 'notifications';
/**
 * Notification Sender
 * Integrates email and push notifications with task data
 */

import { sendEmail, generateReminderEmail, generateReminderText } from './email';
import type { Task } from '@/types/index';
import { getUserRepository, getNotificationSettingsRepository, getPushSubscriptionRepository } from '@/lib/repositories';
import webPush from 'web-push';

// Configure web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:noreply@taskplanner.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface NotificationResult {
  success: boolean;
  method: 'email' | 'push' | 'none';
  error?: string;
}

/**
 * Send task reminder via email
 */
export async function sendTaskReminder(
  task: Task,
  userId: string
): Promise<NotificationResult> {
  const userRepo = getUserRepository();

  const user = userRepo.findById(userId);
  if (!user?.email) {
    return { success: false, method: 'none', error: 'User email not found' };
  }

  const html = generateReminderEmail({
    title: task.title,
    description: task.description,
    deadline: task.deadline,
    priority: task.priority,
  });

  const text = generateReminderText({
    title: task.title,
    description: task.description,
    deadline: task.deadline,
    priority: task.priority as any,
  });

  const sent = await sendEmail({
    to: user.email,
    subject: `Task Reminder: ${task.title}`,
    html,
    text,
  });

  return {
    success: sent,
    method: 'email',
    error: sent ? undefined : 'Failed to send email',
  };
}

/**
 * Send push notification
 */
export async function sendPushNotification(
  endpoint: string,
  payload: { title: string; body: string; taskId?: string },
  p256dh: string,
  auth: string
): Promise<NotificationResult> {
  try {
    await webPush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload)
    );
    return { success: true, method: 'push' };
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { success: false, method: 'push', error: String(error) };
  }
}

/**
 * Send notification via user's preferred channel
 */
export async function sendUserNotification(
  userId: string,
  task: Task
): Promise<NotificationResult> {
  const nsRepo = getNotificationSettingsRepository();
  const pushRepo = getPushSubscriptionRepository();

  const settings = nsRepo.findByUserId(userId);

  if (!settings) {
    return { success: false, method: 'none', error: 'No notification settings' };
  }

  // Prefer push if available, fallback to email
  if (settings.pushNotifications) {
    const subscriptions = pushRepo.findByUserId(userId);
    if (subscriptions.length > 0) {
      const subscription = subscriptions[0];
      return sendPushNotification(
        subscription.endpoint,
        {
          title: task.title,
          body: task.description || 'Task reminder',
          taskId: task.id,
        },
        subscription.p256dh,
        subscription.auth
      );
    }
  }

  if (settings.emailNotifications) {
    return sendTaskReminder(task, userId);
  }

  return { success: false, method: 'none', error: 'No notification method configured' };
}
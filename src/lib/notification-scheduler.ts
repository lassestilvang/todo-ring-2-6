/**
 * Notification Scheduler
 * Platform-aware notification routing with mobile/desktop preferences
 */

import { getTaskRepository, getNotificationSettingsRepository, getPushSubscriptionRepository, getUserRepository } from '@/lib/repositories';
import webPush from 'web-push';
import type { Task } from '@/types/index';

// Configure VAPID for push notifications
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:noreply@taskplanner.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Platform detection utilities
export type NotificationPlatform = 'mobile' | 'desktop' | 'web' | 'email';

interface PlatformPreferences {
  mobile: boolean;
  desktop: boolean;
  web: boolean;
  email: boolean;
}

/**
 * Platform-aware notification routing
 */
export class NotificationScheduler {
  private static instance: NotificationScheduler;

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Get platform-specific preferences for a user
   */
  async getUserPreferences(userId: string): Promise<PlatformPreferences> {
    const nsRepo = getNotificationSettingsRepository();
    const settings = nsRepo.findByUserId(userId);

    // Default to all platforms enabled
    return {
      mobile: settings?.pushNotifications ?? true,
      desktop: settings?.pushNotifications ?? true,
      web: settings?.pushNotifications ?? true,
      email: settings?.emailNotifications ?? true,
    };
  }

  /**
   * Send platform-specific push notification
   */
  async sendPushToPlatform(
    endpoint: string,
    payload: { title: string; body: string; taskId?: string; platform: NotificationPlatform },
    p256dh: string,
    auth: string
  ): Promise<boolean> {
    try {
      await webPush.sendNotification(
        { endpoint, keys: { p256dh, auth } },
        JSON.stringify({
          ...payload,
          platform: payload.platform,
          timestamp: Date.now(),
        })
      );
      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  /**
   * Send notifications based on user platform preferences
   */
  async sendPlatformAwareNotification(
    userId: string,
    task: Task,
    platform?: NotificationPlatform
  ): Promise<{ platform: NotificationPlatform; success: boolean }[]> {
    const preferences = await this.getUserPreferences(userId);
    const pushRepo = getPushSubscriptionRepository();
    const subscriptions = pushRepo.findByUserId(userId);
    const userRepo = getUserRepository();
    const user = userRepo.findById(userId);

    const results: { platform: NotificationPlatform; success: boolean }[] = [];

    // Send push notifications to matching platforms
    for (const subscription of subscriptions) {
      const detectedPlatform = this.detectPlatform(subscription.endpoint, subscription.userAgent);

      // If platform specified, only send to that platform
      // Otherwise, send to all enabled platforms
      const shouldSend = platform
        ? detectedPlatform === platform && (preferences as any)[detectedPlatform]
        : (preferences as any)[detectedPlatform];

      if (shouldSend) {
        const success = await this.sendPushToPlatform(
          subscription.endpoint,
          {
            title: task.title,
            body: task.description || 'Task reminder',
            taskId: task.id,
            platform: detectedPlatform,
          },
          subscription.p256dh,
          subscription.auth
        );

        results.push({ platform: detectedPlatform, success });
      }
    }

    // Send email notifications if enabled
    if (preferences.email && (!platform || platform === 'email')) {
      const emailSuccess = await this.sendEmailNotification(user?.email, task);
      results.push({ platform: 'email', success: emailSuccess });
    }

    return results;
  }

  /**
   * Detect platform from subscription endpoint or user agent
   */
  private detectPlatform(endpoint: string, userAgent?: string): NotificationPlatform {
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
      }
    }

    // Mobile push endpoints typically use different domains
    if (endpoint.includes('fcm.googleapis.com') || endpoint.includes('fcm-api.apple.com')) {
      return 'mobile';
    }

    return 'desktop';
  }

  /**
   * Send email notification (stub - integrate with email service)
   */
  private async sendEmailNotification(email: string | undefined, task: Task): Promise<boolean> {
    if (!email) return false;

    // TODO: Implement actual email sending
    // This would integrate with your existing email service
    console.log(`[EMAIL] Would send to ${email}: ${task.title}`);
    return true;
  }

  /**
   * Schedule recurring notifications for a task
   */
  async scheduleTaskNotifications(userId: string, task: Task): Promise<void> {
    const preferences = await this.getUserPreferences(userId);

    // Only schedule if notifications are enabled for any platform
    const hasEnabledPlatform = Object.values(preferences).some(v => v);
    if (!hasEnabledPlatform) return;

    // Get user's timezone and reminder preferences
    const userRepo = getUserRepository();
    const user = userRepo.findById(userId);
    const timezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Calculate notification times based on deadline and user preferences
    // This would integrate with a job queue like BullMQ
    console.log(`Scheduled notifications for task ${task.id} in timezone ${timezone}`);
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();
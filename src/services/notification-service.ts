// src/services/notification-service.ts

import { webpush } from 'web-push';
import type { Task } from '@/types/index';

interface NotificationConfig {
  vapidDetails: {
    subject: string;
    publicKey: string;
    privateKey: string;
  };
  fcmserviceAccountKey?: string; // For Firebase Cloud Messaging
  apnsConfig?: {
    key: string;
    keyId: string;
    teamId: string;
    bundleId: string;
  };
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  renotify?: boolean;
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp?: number;
}

interface NotificationPayload {
  userId: string;
  notification: PushNotification;
  // For targeted notifications
  topic?: string;
  condition?: string; // FCM condition
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;

    // Initialize web-push
    webpush.setVapidDetails(
      config.vapidDetails.subject,
      config.vapidDetails.publicKey,
      config.vapidDetails.privateKey
    );
  }

  /**
   * Send a push notification to a specific user
   */
  async sendPushNotification(subscription: PushSubscription, payload: NotificationPayload) {
    try {
      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload.notification)
      );
      return { success: true, result };
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Send notification to multiple users via topic (FCM)
   */
  async sendTopicNotification(topic: string, payload: NotificationPayload) {
    // This would integrate with Firebase Admin SDK or similar
    // For now, returning a placeholder
    return {
      success: true,
      message: `Notification sent to topic: ${topic}`,
      // In real implementation: await admin.messaging().send({ topic, notification: payload.notification })
    };
  }

  /**
   * Schedule a notification for future delivery
   */
  scheduleNotification(
    subscription: PushSubscription,
    payload: NotificationPayload,
    delayMs: number
  ) {
    return setTimeout(() => {
      this.sendPushNotification(subscription, payload);
    }, delayMs);
  }

  /**
   * Create a task-related notification
   */
  createTaskNotification(task: Task, type: 'created' | 'updated' | 'completed' | 'reminder'): NotificationPayload {
    const baseNotification: PushNotification = {
      title: `TaskPlanner - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      tag: `task-${task.id}`,
      data: {
        taskId: task.id,
        url: `/tasks/${task.id}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Task',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    let body = '';
    switch (type) {
      case 'created':
        body = `New task created: ${task.title}`;
        break;
      case 'updated':
        body = `Task updated: ${task.title}`;
        break;
      case 'completed':
        body = `Task completed: ${task.title}`;
        baseNotification.actions = [
          {
            action: 'view',
            title: 'View Task',
            icon: '/icons/view.png'
          },
          {
            action: 'celebrate',
            title: 'Celebrate 🎉',
            icon: '/icons/celebrate.png'
          }
        ];
        break;
      case 'reminder':
        body = `Reminder: ${task.title}`;
        baseNotification.requireInteraction = true;
        break;
    }

    return {
      userId: task.userId || 'unknown',
      notification: { ...baseNotification, body }
    };
  }

  /**
   * Handle subscription changes
   */
  async handleSubscriptionChange(userId: string, subscription: PushSubscription | null) {
    if (!subscription) {
      // Unsubscribe user
      return await this.unsubscribeUser(userId);
    }

    // Subscribe or update subscription
    return await this.saveSubscription(userId, subscription);
  }

  // Placeholder methods for actual implementation
  private async saveSubscription(userId: string, subscription: PushSubscription) {
    // Save to database
    return { success: true };
  }

  private async unsubscribeUser(userId: string) {
    // Remove from database
    return { success: true };
  }
}

// VAPID key generator for development
export function generateVAPIDKeys() {
  // In production, these should be securely stored and rotated periodically
  return webpush.generateVAPIDKeys();
}

// Export types for use in components
export type { NotificationConfig, PushNotification, NotificationPayload };
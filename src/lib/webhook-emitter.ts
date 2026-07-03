/**
 * Webhook Event Emitter
 * Emits events when resources are created, updated, or deleted
 */

import crypto from 'crypto';
import { addNotificationJob } from './queues';

// Webhook event types
export const WEBHOOK_EVENTS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  LIST_CREATED: 'list.created',
  LIST_UPDATED: 'list.updated',
  LIST_DELETED: 'list.deleted',
  COMMENT_CREATED: 'comment.created',
  GOAL_CREATED: 'goal.created',
  GOAL_UPDATED: 'goal.updated',
  GOAL_DELETED: 'goal.deleted',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// In-memory webhook registry (replace with database in production)
const webhookRegistry: Array<{
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
}> = [];

/**
 * Register a webhook
 */
export function registerWebhook(data: {
  url: string;
  events: string[];
  secret?: string;
}): { id: string; url: string; events: string[]; isActive: boolean } {
  const webhook = {
    id: crypto.randomUUID(),
    url: data.url,
    events: data.events,
    secret: data.secret,
    isActive: true,
  };

  webhookRegistry.push(webhook);
  return webhook;
}

/**
 * Remove a webhook
 */
export function removeWebhook(id: string): boolean {
  const index = webhookRegistry.findIndex(w => w.id === id);
  if (index === -1) return false;

  webhookRegistry.splice(index, 1);
  return true;
}

/**
 * Get webhooks for an event
 */
export function getWebhooksForEvent(event: WebhookEvent) {
  return webhookRegistry.filter(w => w.isActive && w.events.includes(event));
}

/**
 * Emit a webhook event
 */
export async function emitWebhookEvent(
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  const webhooks = getWebhooksForEvent(event);

  for (const webhook of webhooks) {
    try {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID(),
      };

      // Add signature if secret is provided
      const signature = webhook.secret
        ? crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex')
        : undefined;

      // Queue notification job to send webhook
      await addNotificationJob({
        userId: 'system',
        title: `Webhook: ${event}`,
        body: JSON.stringify({ ...payload, signature }),
        type: 'email', // Will be handled by webhook sender
        data: {
          webhookUrl: webhook.url,
          payload: { ...payload, signature },
        },
      });

      console.log(`Webhook emitted: ${event} to ${webhook.url}`);
    } catch (error) {
      console.error(`Failed to emit webhook ${event}:`, error);
    }
  }
}

/**
 * Get all registered webhooks
 */
export function getAllWebhooks() {
  return webhookRegistry.filter(w => w.isActive);
}
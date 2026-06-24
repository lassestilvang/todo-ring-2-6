/**
 * Push Subscription Repository
 * Handles all database operations related to push subscriptions
 */

import { getDb } from '../../db/index';
import type { PushSubscription } from '@/types/index';

export class PushSubscriptionRepository {
  private db = getDb();

  findAll(): PushSubscription[] {
    return this.db.prepare(
      'SELECT * FROM push_subscriptions ORDER BY created_at DESC'
    ).all() as PushSubscription[];
  }

  findById(id: string): PushSubscription | undefined {
    return this.db.prepare('SELECT * FROM push_subscriptions WHERE id = ?').get(id) as PushSubscription | undefined;
  }

  findByUserId(userId: string): PushSubscription[] {
    return this.db.prepare(
      'SELECT * FROM push_subscriptions WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as PushSubscription[];
  }

  create(data: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): PushSubscription {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.userId, data.endpoint, data.p256dh, data.auth, now);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(id);
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
  }

  /**
   * Check if a subscription endpoint already exists (prevent duplicates)
   */
  findByEndpoint(endpoint: string): PushSubscription | undefined {
    return this.db.prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?').get(endpoint) as PushSubscription | undefined;
  }
}

let pushSubscriptionRepository: PushSubscriptionRepository | null = null;

export function getPushSubscriptionRepository(): PushSubscriptionRepository {
  if (!pushSubscriptionRepository) {
    pushSubscriptionRepository = new PushSubscriptionRepository();
  }
  return pushSubscriptionRepository;
}
import { BaseRepository } from './base-repository';
import type { PushSubscription } from '../../src/types/index';

export class PushSubscriptionRepository extends BaseRepository<PushSubscription> {
  constructor() {
    super('push_subscriptions');
  }

  getByUserId(userId: string): PushSubscription[] {
    return this.db.prepare(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?'
    ).all(userId) as PushSubscription[];
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
  }
}

export function getPushSubscriptionRepository(): PushSubscriptionRepository {
  return new PushSubscriptionRepository();
}

/**
 * Notification Settings Repository
 * Handles all database operations related to notification settings
 */

import { getDb } from '../../db/index';
import type { NotificationSettings } from '@/types/index';

export class NotificationSettingsRepository {
  private db = getDb();

  findByUserId(userId: string): NotificationSettings | undefined {
    return this.db.prepare(
      'SELECT * FROM notification_settings WHERE user_id = ?'
    ).get(userId) as NotificationSettings | undefined;
  }

  findById(id: string): NotificationSettings | undefined {
    return this.db.prepare('SELECT * FROM notification_settings WHERE id = ?').get(id) as NotificationSettings | undefined;
  }

  create(data: {
    userId: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    reminderLeadTime?: number;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    notificationDays?: string[];
  }): NotificationSettings {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO notification_settings (id, user_id, email_notifications, push_notifications, reminder_lead_time, quiet_hours_start, quiet_hours_end, notification_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      data.userId,
      data.emailNotifications !== undefined ? (data.emailNotifications ? 1 : 0) : 1,
      data.pushNotifications !== undefined ? (data.pushNotifications ? 1 : 0) : 1,
      data.reminderLeadTime ?? 15,
      data.quietHoursStart ?? '22:00',
      data.quietHoursEnd ?? '08:00',
      JSON.stringify(data.notificationDays ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
      now,
      now
    );

    return this.findById(id)!;
  }

  update(userId: string, data: Partial<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    reminderLeadTime: number;
    quietHoursStart: string;
    quietHoursEnd: string;
    notificationDays: string[];
  }>): NotificationSettings {
    const existing = this.findByUserId(userId);
    if (!existing) {
      return this.create({ userId, ...data });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.emailNotifications !== undefined) { updates.push('email_notifications = ?'); values.push(data.emailNotifications ? 1 : 0); }
    if (data.pushNotifications !== undefined) { updates.push('push_notifications = ?'); values.push(data.pushNotifications ? 1 : 0); }
    if (data.reminderLeadTime !== undefined) { updates.push('reminder_lead_time = ?'); values.push(data.reminderLeadTime); }
    if (data.quietHoursStart !== undefined) { updates.push('quiet_hours_start = ?'); values.push(data.quietHoursStart); }
    if (data.quietHoursEnd !== undefined) { updates.push('quiet_hours_end = ?'); values.push(data.quietHoursEnd); }
    if (data.notificationDays !== undefined) { updates.push('notification_days = ?'); values.push(JSON.stringify(data.notificationDays)); }
    values.push(userId);

    this.db.prepare(`UPDATE notification_settings SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);

    return this.findByUserId(userId)!;
  }

  delete(userId: string): void {
    this.db.prepare('DELETE FROM notification_settings WHERE user_id = ?').run(userId);
  }
}

let notificationSettingsRepository: NotificationSettingsRepository | null = null;

export function getNotificationSettingsRepository(): NotificationSettingsRepository {
  if (!notificationSettingsRepository) {
    notificationSettingsRepository = new NotificationSettingsRepository();
  }
  return notificationSettingsRepository;
}
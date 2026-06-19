import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getDb } from '@/db/db-client';

ensureDbInitialized();

const db = getDb();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const settings = db.prepare(
      'SELECT * FROM notification_settings WHERE user_id = ?'
    ).get(userId);

    if (!settings) {
      return jsonSuccess({
        userId,
        emailNotifications: true,
        pushNotifications: true,
        reminderLeadTime: 15,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        notificationDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      });
    }

    return jsonSuccess(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notification settings';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...settings } = body;

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const existing = db.prepare(
      'SELECT id FROM notification_settings WHERE user_id = ?'
    ).get(userId);

    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE notification_settings SET
          email_notifications = COALESCE(?, email_notifications),
          push_notifications = COALESCE(?, push_notifications),
          reminder_lead_time = COALESCE(?, reminder_lead_time),
          quiet_hours_start = COALESCE(?, quiet_hours_start),
          quiet_hours_end = COALESCE(?, quiet_hours_end),
          notification_days = COALESCE(?, notification_days),
          updated_at = ?
        WHERE user_id = ?
      `).run(
        settings.emailNotifications,
        settings.pushNotifications,
        settings.reminderLeadTime,
        settings.quietHoursStart,
        settings.quietHoursEnd,
        JSON.stringify(settings.notificationDays || []),
        now,
        userId
      );
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notification_settings (id, user_id, email_notifications, push_notifications,
          reminder_lead_time, quiet_hours_start, quiet_hours_end, notification_days, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, userId,
        settings.emailNotifications ?? true,
        settings.pushNotifications ?? true,
        settings.reminderLeadTime ?? 15,
        settings.quietHoursStart ?? '22:00',
        settings.quietHoursEnd ?? '08:00',
        JSON.stringify(settings.notificationDays || []),
        now, now
      );
    }

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notification settings';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

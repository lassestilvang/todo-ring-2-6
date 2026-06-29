/**
 * Unified Scheduler Module
 *
 * Provides a single entry point for recurring task processing and
 * notification dispatch. It abstracts the database and email/push
 * integration details and offers a clean API for CLI scripts and
 * background workers.
 */

import type { Database } from 'better-sqlite3';
import { getDb } from '@/db/index';

interface RecurringTask {
  id: string;
  title: string;
  description: string;
  list_id: string;
  date: string;
  deadline?: string;
  estimate_hours?: number;
  estimate_minutes?: number;
  priority: string;
  recurring_type: string;
  recurring_interval?: string;
  is_all_day: boolean;
}

interface NotificationPayload {
  taskId: string;
  userId: string;
  message: string;
  type: 'reminder' | 'due' | 'recurring';
  scheduledAt: Date;
}

/**
 * Process recurring tasks for a given window.
 * Returns the number of created task instances.
 */
export async function processRecurring(windowInDays: number = 30): Promise<number> {
  const db: Database = getDb();

  // Fetch recurring tasks that are active
  const recurringTasks = db
    .prepare(
      "SELECT * FROM tasks WHERE recurring_type != 'none' AND status NOT IN ('completed', 'cancelled')"
    )
    .all() as RecurringTask[];

  let created = 0;
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + windowInDays);

  const isSameDay = (a: Date, b: Date) =>
    a.toISOString().split('T')[0] === b.toISOString().split('T')[0];

  for (const task of recurringTasks) {
    let cursor = task.date ? new Date(task.date) : today;
    while (cursor <= endDate) {
      const cursorStr = cursor.toISOString().split('T')[0];
      // Ensure no duplicate for the same title/date
      const exists = db
        .prepare('SELECT id FROM tasks WHERE title = ? AND date = ? AND recurring_type = ?')
        .get(task.title, cursorStr, 'none');

      if (!exists) {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO tasks (
            id, title, description, list_id, date, deadline,
            estimate_hours, estimate_minutes, priority, status,
            recurring_type, recurring_interval, is_all_day,
            created_at, updated_at, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
        `).run(
          newId,
          `${task.title} (recurring)`,
          task.description,
          task.list_id,
          cursorStr,
          task.deadline,
          task.estimate_hours,
          task.estimate_minutes,
          task.priority,
          task.recurring_type,
          task.recurring_interval || '',
          task.is_all_day ? 1 : 0,
          now,
          now,
          1
        );
        created++;
      }

      // Move to next occurrence
      cursor = getNextOccurrence(cursor, task.recurring_type);
    }
  }

  return created;
}

/**
 * Schedule a notification to be sent at a specific time.
 */
export function scheduleNotification(payload: NotificationPayload): void {
  // This would integrate with your notification system
  // For now, it logs the scheduled notification
  console.log('Scheduled notification:', {
    ...payload,
    scheduledAt: payload.scheduledAt.toISOString(),
  });
}

/**
 * Process pending notifications (send due notifications).
 */
export async function processNotifications(): Promise<number> {
  const db: Database = getDb();
  const now = new Date();

  const pending = db
    .prepare(
      "SELECT * FROM notifications WHERE status = 'pending' AND scheduled_at <= ?"
    )
    .all(now.toISOString());

  let sent = 0;
  for (const notification of pending) {
    // Send notification (email/push)
    console.log('Sending notification:', notification.id);
    db.prepare("UPDATE notifications SET status = 'sent' WHERE id = ?").run(notification.id);
    sent++;
  }

  return sent;
}

function getNextOccurrence(date: Date, type: string): Date {
  const next = new Date(date);

  switch (type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'weekdays':
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Reminder Repository
 * Handles all database operations related to task reminders
 */

import { getDb } from '../../db/index';
import type { Reminder } from '@/types/index';

export class ReminderRepository {
  private db = getDb();

  findByTaskId(taskId: string): Reminder[] {
    return this.db.prepare(
      'SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC'
    ).all(taskId) as Reminder[];
  }

  findById(id: string): Reminder | undefined {
    return this.db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder | undefined;
  }

  create(data: {
    taskId: string;
    remindAt: string;
    method?: 'notification' | 'email';
  }): Reminder {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO reminders (id, task_id, remind_at, method, is_fired, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
    ).run(id, data.taskId, data.remindAt, data.method || 'notification', now, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ remindAt: string; method: string; isFired: boolean }>): Reminder {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.remindAt !== undefined) { updates.push('remind_at = ?'); values.push(data.remindAt); }
    if (data.method !== undefined) { updates.push('method = ?'); values.push(data.method); }
    if (data.isFired !== undefined) { updates.push('is_fired = ?'); values.push(data.isFired ? 1 : 0); }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
  }

  deleteByTaskId(taskId: string): void {
    this.db.prepare('DELETE FROM reminders WHERE task_id = ?').run(taskId);
  }

  getUpcoming(limit: number = 10): Reminder[] {
    const now = new Date().toISOString();
    return this.db.prepare(
      'SELECT * FROM reminders WHERE remind_at >= ? AND is_fired = 0 ORDER BY remind_at ASC LIMIT ?'
    ).all(now, limit) as Reminder[];
  }

  getPending(): Reminder[] {
    return this.db.prepare(
      'SELECT * FROM reminders WHERE is_fired = 0 ORDER BY remind_at ASC'
    ).all() as Reminder[];
  }

  markAsFired(id: string): void {
    this.db.prepare('UPDATE reminders SET is_fired = 1 WHERE id = ?').run(id);
  }
}

let reminderRepository: ReminderRepository | null = null;

export function getReminderRepository(): ReminderRepository {
  if (!reminderRepository) {
    reminderRepository = new ReminderRepository();
  }
  return reminderRepository;
}
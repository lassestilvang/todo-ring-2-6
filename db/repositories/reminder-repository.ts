import { BaseRepository } from './base-repository';
import type { Reminder } from '../../src/types/index';

export class ReminderRepository extends BaseRepository<Reminder> {
  constructor() {
    super('reminders');
  }

  getByTaskId(taskId: string): Reminder[] {
    return this.db.prepare(
      'SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC'
    ).all(taskId) as Reminder[];
  }

  getUpcoming(limit: number = 100): Reminder[] {
    const now = new Date().toISOString();
    return this.db.prepare(
      'SELECT * FROM reminders WHERE remind_at >= ? AND is_fired = 0 ORDER BY remind_at ASC LIMIT ?'
    ).all(now, limit) as Reminder[];
  }

  getUnfired(before: string, limit: number = 100): Reminder[] {
    return this.db.prepare(
      'SELECT * FROM reminders WHERE is_fired = 0 AND remind_at <= ? ORDER BY remind_at ASC LIMIT ?'
    ).all(before, limit) as Reminder[];
  }

  markFired(id: string): void {
    this.db.prepare(
      'UPDATE reminders SET is_fired = 1, updated_at = ? WHERE id = ?'
    ).run(new Date().toISOString(), id);
  }
}

export function getReminderRepository(): ReminderRepository {
  return new ReminderRepository();
}

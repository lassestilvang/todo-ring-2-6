import { BaseRepository } from './base-repository';
import type { TimeEntry } from '../../src/types/index';

export class TimeEntryRepository extends BaseRepository<TimeEntry> {
  constructor() {
    super('time_entries', { timestamps: true });
  }

  /**
   * Get time entries by task ID
   */
  getByTaskId(taskId: string): TimeEntry[] {
    return this.db.prepare(
      'SELECT * FROM time_entries WHERE task_id = ? ORDER BY start_time DESC'
    ).all(taskId) as TimeEntry[];
  }

  /**
   * Get time entries by date range
   */
  getByDateRange(userId: string, dateFrom: string, dateTo: string): TimeEntry[] {
    return this.db.prepare(
      'SELECT * FROM time_entries WHERE user_id = ? AND start_time >= ? AND start_time <= ? ORDER BY start_time DESC'
    ).all(userId, dateFrom, dateTo) as TimeEntry[];
  }

  /**
   * Calculate total duration for a task
   */
  getTotalDuration(taskId: string): number {
    const result = this.db.prepare(
      'SELECT SUM(duration) as total FROM time_entries WHERE task_id = ?'
    ).get(taskId) as { total: number | null };
    return result.total || 0;
  }

  /**
   * Calculate total duration for all tasks (user stats)
   */
  getUserTotalDuration(userId: string): number {
    const result = this.db.prepare(
      'SELECT SUM(duration) as total FROM time_entries WHERE user_id = ?'
    ).get(userId) as { total: number | null };
    return result.total || 0;
  }

  /**
   * Get weekly time summary
   */
  getWeeklySummary(userId: string, weekStart: string): TimeEntry[] {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.db.prepare(
      'SELECT * FROM time_entries WHERE user_id = ? AND start_time >= ? AND start_time < ? ORDER BY start_time ASC'
    ).all(userId, weekStart, weekEnd.toISOString()) as TimeEntry[];
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private now(): string {
    return new Date().toISOString();
  }
}
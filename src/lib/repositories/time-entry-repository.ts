/**
 * Time Entry Repository
 * Handles all database operations related to time entries
 */

import { getDb } from '../../db/index';
import type { TimeEntry } from '@/types/index';

export class TimeEntryRepository {
  private db = getDb();

  findByTaskId(taskId: string): TimeEntry[] {
    return this.db.prepare(
      'SELECT * FROM time_entries WHERE task_id = ? ORDER BY start_time DESC'
    ).all(taskId) as TimeEntry[];
  }

  findById(id: string): TimeEntry | undefined {
    return this.db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntry | undefined;
  }

  create(data: {
    taskId: string;
    startTime: string;
    endTime?: string | null;
    duration: number;
    description?: string;
  }): TimeEntry {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO time_entries (id, task_id, start_time, end_time, duration, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.taskId, data.startTime, data.endTime || null, data.duration, data.description || '', now, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ endTime: string | null; duration: number; description: string }>): TimeEntry {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.endTime !== undefined) { updates.push('end_time = ?'); values.push(data.endTime); }
    if (data.duration !== undefined) { updates.push('duration = ?'); values.push(data.duration); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    values.push(id);

    this.db.prepare(`UPDATE time_entries SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
  }

  deleteByTask(taskId: string): void {
    this.db.prepare('DELETE FROM time_entries WHERE task_id = ?').run(taskId);
  }

  /**
   * Alias for findByTaskId - for API compatibility
   */
  findByTask(taskId: string): TimeEntry[] {
    return this.findByTaskId(taskId);
  }

  /**
   * Find entries within a date range
   */
  findInRange(startDate: Date, endDate: Date): TimeEntry[] {
    return this.db.prepare(
      'SELECT * FROM time_entries WHERE start_time >= ? AND start_time <= ? ORDER BY start_time DESC'
    ).all(startDate.toISOString(), endDate.toISOString()) as TimeEntry[];
  }

  getReports(period: 'day' | 'week' | 'month' = 'week', taskId?: string): { totalMinutes: number; entries: TimeEntry[] } {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const startISO = startDate.toISOString();
    const endISO = now.toISOString();

    let query = `
      SELECT * FROM time_entries
      WHERE start_time >= ? AND start_time <= ?
    `;
    const values: (string | number)[] = [startISO, endISO];

    if (taskId) {
      query += ' AND task_id = ?';
      values.push(taskId);
    }

    query += ' ORDER BY start_time DESC';

    const entries = this.db.prepare(query).all(...values) as TimeEntry[];
    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);

    return { totalMinutes, entries };
  }
}

let timeEntryRepository: TimeEntryRepository | null = null;

export function getTimeEntryRepository(): TimeEntryRepository {
  if (!timeEntryRepository) {
    timeEntryRepository = new TimeEntryRepository();
  }
  return timeEntryRepository;
}
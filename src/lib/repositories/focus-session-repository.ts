/**
 * Focus Session Repository
 * Handles all database operations related to focus sessions (Pomodoro)
 */

import { getDb } from '../../db/index';
import type { FocusSession } from '@/types/index';

export class FocusSessionRepository {
  private db = getDb();

  findAll(userId?: string, limit?: number): FocusSession[] {
    if (userId) {
      let query = 'SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY started_at DESC';
      const values = [userId];
      if (limit) {
        query += ' LIMIT ?';
        values.push(limit);
      }
      return this.db.prepare(query).all(...values) as FocusSession[];
    }
    return this.db.prepare(
      'SELECT * FROM focus_sessions ORDER BY started_at DESC'
    ).all() as FocusSession[];
  }

  findById(id: string): FocusSession | undefined {
    return this.db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(id) as FocusSession | undefined;
  }

  create(data: {
    userId: string;
    taskId?: string;
    duration: number;
    startedAt: string;
    status?: 'active' | 'completed' | 'cancelled';
  }): FocusSession {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO focus_sessions (id, user_id, task_id, duration, started_at, completed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      data.userId,
      data.taskId || null,
      data.duration,
      data.startedAt || now,
      data.status === 'completed' ? now : null,
      data.status || 'active'
    );

    return this.findById(id)!;
  }

  update(id: string, data: Partial<Omit<FocusSession, 'id'>>): FocusSession {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.userId !== undefined) { updates.push('user_id = ?'); values.push(data.userId); }
    if (data.taskId !== undefined) { updates.push('task_id = ?'); values.push(data.taskId); }
    if (data.duration !== undefined) { updates.push('duration = ?'); values.push(data.duration); }
    if (data.startedAt !== undefined) { updates.push('started_at = ?'); values.push(data.startedAt); }
    if (data.completedAt !== undefined) { updates.push('completed_at = ?'); values.push(data.completedAt); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }

    values.push(id);

    this.db.prepare(`UPDATE focus_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM focus_sessions WHERE id = ?').run(id);
  }

  getActiveSessions(userId: string): FocusSession[] {
    return this.db.prepare(
      'SELECT * FROM focus_sessions WHERE user_id = ? AND status = ? ORDER BY started_at DESC'
    ).all(userId, 'active') as FocusSession[];
  }

  complete(id: string): FocusSession {
    const now = new Date().toISOString();
    this.db.prepare(
      'UPDATE focus_sessions SET status = ?, completed_at = ? WHERE id = ?'
    ).run('completed', now, id);
    return this.findById(id)!;
  }
}

// Singleton instance
let focusSessionRepository: FocusSessionRepository | null = null;

export function getFocusSessionRepository(): FocusSessionRepository {
  if (!focusSessionRepository) {
    focusSessionRepository = new FocusSessionRepository();
  }
  return focusSessionRepository;
}
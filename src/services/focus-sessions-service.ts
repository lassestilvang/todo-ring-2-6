/**
 * Focus Sessions Service
 * Manages Pomodoro sessions, focus time tracking, and productivity analytics
 */

import { getDb } from '@/lib/db-client';
import type { Task } from '@/types/index';

export type FocusSessionStatus = 'active' | 'completed' | 'cancelled';

export interface FocusSession {
  id: string;
  taskId?: string | null;
  userId: string;
  duration: number; // in minutes
  startedAt: string;
  completedAt?: string | null;
  status: FocusSessionStatus;
  isPomodoro: boolean;
  pomodorosCompleted: number;
  breaksTaken: number;
}

export interface FocusStats {
  totalSessions: number;
  totalDuration: number;
  avgSessionLength: number;
  completionRate: number;
  streakDays: number;
  todayMinutes: number;
}

/**
 * Start a new focus session
 */
export function startFocusSession(userId: string, data: {
  taskId?: string;
  duration: number;
  isPomodoro?: boolean;
}): FocusSession {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO focus_sessions (id, task_id, user_id, duration, started_at, status, is_pomodoro, pomodoros_completed, breaks_taken)
    VALUES (?, ?, ?, ?, ?, 'active', ?, 0, 0)
  `).run(id, data.taskId || null, userId, data.duration, now, data.isPomodoro || false);

  return {
    id,
    taskId: data.taskId || null,
    userId,
    duration: data.duration,
    startedAt: now,
    status: 'active',
    isPomodoro: data.isPomodoro || false,
    pomodorosCompleted: 0,
    breaksTaken: 0
  };
}

/**
 * Complete a focus session
 */
export function completeFocusSession(id: string, userId: string): FocusSession | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE focus_sessions
    SET status = 'completed', completed_at = ?
    WHERE id = ? AND user_id = ?
  `).run(now, id, userId);

  if (result.changes === 0) return undefined;

  return getFocusSession(id, userId);
}

/**
 * Cancel a focus session
 */
export function cancelFocusSession(id: string, userId: string): FocusSession | undefined {
  const db = getDb();

  const result = db.prepare(`
    UPDATE focus_sessions
    SET status = 'cancelled', completed_at = (datetime('now'))
    WHERE id = ? AND user_id = ?
  `).run(id, userId);

  if (result.changes === 0) return undefined;

  return getFocusSession(id, userId);
}

/**
 * Get a single focus session
 */
export function getFocusSession(id: string, userId: string): FocusSession | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?')
    .get(id, userId) as FocusSession | undefined;
}

/**
 * Get all focus sessions for a user
 */
export function getFocusSessions(userId: string, options?: {
  date?: string;
  status?: FocusSessionStatus;
  limit?: number;
}): FocusSession[] {
  const db = getDb();
  let query = 'SELECT * FROM focus_sessions WHERE user_id = ?';
  const params: any[] = [userId];

  if (options?.date) {
    query += ' AND date(started_at) = ?';
    params.push(options.date);
  }

  if (options?.status) {
    query += ' AND status = ?';
    params.push(options.status);
  }

  query += ' ORDER BY started_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.prepare(query).all(...params) as FocusSession[];
}

/**
 * Get focus statistics for a user
 */
export function getFocusStats(userId: string, period: 'day' | 'week' | 'month' = 'week'): FocusStats {
  const db = getDb();
  const now = new Date();

  let startDate: Date;
  switch (period) {
    case 'day':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  const stats = db
    .prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(duration) as total_duration,
        AVG(duration) as avg_duration,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        GROUP_CONCAT(id) as session_ids
      FROM focus_sessions
      WHERE user_id = ? AND started_at >= ?
    `)
    .get(userId, startDate.toISOString()) as {
      total_sessions: number;
      total_duration: number;
      avg_duration: number;
      completed_sessions: number;
      session_ids: string;
    } | undefined;

  const totalSessions = stats?.total_sessions || 0;
  const completedSessions = stats?.completed_sessions || 0;

  // Calculate streak
  const streakResult = db
    .prepare(`
      SELECT DISTINCT date(started_at) as day
      FROM focus_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY day DESC
    `)
    .all(userId) as { day: string }[];

  let streakDays = 0;
  const today = new Date().toISOString().split('T')[0];

  for (const session of streakResult) {
    if (session.day === today) {
      streakDays++;
    } else {
      break;
    }
  }

  return {
    totalSessions,
    totalDuration: stats?.total_duration || 0,
    avgSessionLength: stats?.avg_duration || 0,
    completionRate: totalSessions > 0 ? completedSessions / totalSessions : 0,
    streakDays,
    todayMinutes: 0 // Will be calculated separately
  };
}

/**
 * Update pomodoro count
 */
export function completePomodoro(sessionId: string, userId: string): FocusSession | undefined {
  const db = getDb();

  const result = db.prepare(`
    UPDATE focus_sessions
    SET pomodoros_completed = pomodoros_completed + 1
    WHERE id = ? AND user_id = ?
  `).run(sessionId, userId);

  if (result.changes === 0) return undefined;
  return getFocusSession(sessionId, userId);
}

/**
 * Record a break
 */
export function recordBreak(sessionId: string, userId: string): FocusSession | undefined {
  const db = getDb();

  const result = db.prepare(`
    UPDATE focus_sessions
    SET breaks_taken = breaks_taken + 1
    WHERE id = ? AND user_id = ?
  `).run(sessionId, userId);

  if (result.changes === 0) return undefined;
  return getFocusSession(sessionId, userId);
}

/**
 * Get today's focus time
 */
export function getTodayFocusMinutes(userId: string): number {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const result = db
    .prepare(`
      SELECT SUM(duration) as total_minutes
      FROM focus_sessions
      WHERE user_id = ? AND date(started_at) = ? AND status = 'completed'
    `)
    .get(userId, today) as { total_minutes: number } | undefined;

  return result?.total_minutes || 0;
}
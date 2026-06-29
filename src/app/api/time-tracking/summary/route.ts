import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const db = getDb();

    // Get total tracked time
    const totalTimeResult = db.prepare(
      `SELECT
         COALESCE(SUM(duration), 0) as total_minutes
       FROM time_entries`
    ).get() as { total_minutes: number };

    const totalMinutes = totalTimeResult?.total_minutes || 0;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // Get today's time
    const today = new Date().toISOString().split('T')[0];
    const todayResult = db.prepare(
      `SELECT COALESCE(SUM(duration), 0) as today_minutes
       FROM time_entries
       WHERE DATE(start_time) = ?`
    ).get(today) as { today_minutes: number };

    const todayMinutes = todayResult?.today_minutes || 0;
    const todayHours = Math.floor(todayMinutes / 60);
    const todayRemainingMinutes = todayMinutes % 60;

    // Get active focus sessions
    const activeSessions = db.prepare(
      `SELECT COUNT(*) as count FROM focus_sessions WHERE status = 'active'`
    ).get() as { count: number };

    // Get recent entries
    const recentEntries = db.prepare(
      `SELECT id, task_id, description, duration, start_time
       FROM time_entries
       ORDER BY start_time DESC
       LIMIT 5`
    ).all() as any[];

    return jsonSuccess({
      totalTime: { hours: totalHours, minutes: remainingMinutes },
      todayTime: { hours: todayHours, minutes: todayRemainingMinutes },
      activeSessions: activeSessions?.count || 0,
      recentEntries: recentEntries.map(e => ({
        id: e.id,
        taskId: e.task_id,
        description: e.description || 'Time entry',
        duration: e.duration,
        startTime: e.start_time,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch time tracking summary';
    return jsonError(message, 500, 'TIME_SUMMARY_ERROR');
  }
}
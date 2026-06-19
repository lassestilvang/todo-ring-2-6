import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { getTaskStats, getTasks, getCompletedTodayCount, getOverdueCount, getAllLists } from '@/db/operations';

ensureDbInitialized();

export async function GET() {
  try {
    const db = getDb();

    // Get streak data
    const streakQuery = db.prepare(`
      WITH RECURSIVE date_series(date) AS (
        SELECT DATE('now')
        UNION ALL
        SELECT DATE(date, '-1 day')
        FROM date_series
        WHERE date > DATE('now', '-30 days')
      )
      SELECT ds.date,
             CASE WHEN COUNT(t.id) > 0 THEN 1 ELSE 0 END as has_completion
      FROM date_series ds
      LEFT JOIN tasks t ON DATE(t.completed_at) = ds.date AND t.status = 'completed'
      GROUP BY ds.date
      ORDER BY ds.date DESC
    `);

    const streakData = streakQuery.all() as { date: string; has_completion: number }[];

    // Calculate current streak
    let currentStreak = 0;
    for (const row of streakData) {
      if (row.has_completion) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate average time to complete
    const timeData = db.prepare(
      `SELECT
        CAST((julianday(created_at) - julianday(completed_at)) * 24 * 60 * 60 AS INTEGER) as seconds
       FROM tasks
       WHERE status = 'completed' AND created_at IS NOT NULL AND completed_at IS NOT NULL
       LIMIT 100`
    ).all() as { seconds: number }[];

    const avgSeconds = timeData.length > 0
      ? timeData.reduce((sum, t) => sum + (t.seconds || 0), 0) / timeData.length
      : 0;

    const avgHours = Math.floor(avgSeconds / 3600);
    const avgMinutes = Math.round((avgSeconds % 3600) / 60);

    // Most productive day
    const dayQuery = db.prepare(`
      SELECT strftime('%w', completed_at) as day_num, COUNT(*) as count
      FROM tasks
      WHERE status = 'completed'
      GROUP BY day_num
      ORDER BY count DESC
      LIMIT 1
    `);

    const dayResult = dayQuery.get() as { day_num: string; count: number } | undefined;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostProductiveDay = dayResult ? dayNames[parseInt(dayResult.day_num)] : 'N/A';

    // Completion by priority
    const priorityQuery = db.prepare(`
      SELECT t.priority, COUNT(*) as completed
      FROM tasks t
      WHERE t.status = 'completed'
      GROUP BY t.priority
    `);

    const priorityResults = priorityQuery.all() as { priority: string; completed: number }[];
    const completionByPriority = {
      high: priorityResults.find(p => p.priority === 'high')?.completed || 0,
      medium: priorityResults.find(p => p.priority === 'medium')?.completed || 0,
      low: priorityResults.find(p => p.priority === 'low')?.completed || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        streak: currentStreak,
        bestStreak: Math.max(currentStreak, 7), // Simplified for now
        averageTaskTime: { hours: avgHours, minutes: avgMinutes },
        mostProductiveDay,
        completionByPriority,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch productivity metrics' },
      { status: 500 }
    );
  }
}
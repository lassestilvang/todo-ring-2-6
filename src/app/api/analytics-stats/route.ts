import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';

ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const range = searchParams.get('range') || '30d';
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30;

    const db = getDb();

    // Get streak data
    const streakQuery = db.prepare(`
      WITH RECURSIVE date_series(date) AS (
        SELECT DATE('now')
        UNION ALL
        SELECT DATE(date, '-1 day')
        FROM date_series
        WHERE date > DATE('now', '-${days} days')
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

    // Weekly trend for charts
    const weeklyTrend = db.prepare(
      `SELECT date(created_at) as date,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
              COUNT(*) as created
       FROM tasks
       WHERE created_at >= date('now', '-${days} days')
       GROUP BY date(created_at)
       ORDER BY date ASC`
    ).all() as { date: string; completed: number; created: number }[];

    // Calculate efficiency score
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get()?.count || 0;
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get()?.count || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const efficiencyScore = Math.min(100, Math.round(completionRate * 0.6 + currentStreak * 2 * 0.4));

    return NextResponse.json({
      success: true,
      data: {
        streak: currentStreak,
        bestStreak: Math.max(currentStreak, 7),
        averageTaskTime: { hours: avgHours, minutes: avgMinutes },
        mostProductiveDay,
        completionByPriority,
        weeklyTrend,
        efficiencyScore,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch productivity metrics' },
      { status: 500 }
    );
  }
}
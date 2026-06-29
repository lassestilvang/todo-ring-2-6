import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

// GET /api/teams/[teamId]/analytics - Get team analytics
export async function GET(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const db = getDb();

    // Get team member IDs
    const memberIds = db.prepare(
      'SELECT user_id FROM team_members WHERE team_id = ?'
    ).all(teamId) as { user_id: string }[];

    if (memberIds.length === 0) {
      return jsonSuccess({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        memberStats: [],
      });
    }

    // Get team stats
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress
      FROM tasks
      WHERE list_id IN (
        SELECT id FROM lists WHERE is_inbox = 0
        UNION
        SELECT list_id FROM team_projects WHERE team_id = ?
      )
    `).get(teamId) as any;

    // Get per-member stats
    const memberStats = db.prepare(`
      SELECT
        u.id,
        u.name,
        COUNT(t.id) as total,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      LEFT JOIN tasks t ON t.assignee_id = u.id
      WHERE tm.team_id = ?
      GROUP BY u.id, u.name
    `).all(teamId) as any[];

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return jsonSuccess({
      totalTasks: stats.total,
      completedTasks: stats.completed,
      pendingTasks: stats.pending,
      inProgressTasks: stats.inProgress,
      completionRate,
      memberStats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return jsonError(message, 500, 'ANALYTICS_ERROR');
  }
}
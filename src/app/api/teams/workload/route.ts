import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getDb } from '@/db/index';

ensureDbInitialized();

/**
 * GET /api/teams/workload
 * Get team workload distribution and analytics
 */
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const teamId = searchParams.get('teamId');

    const db = getDb();

    // Get team members
    const members = db.prepare(`
      SELECT tm.user_id, u.name, u.email, tm.role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `).all(teamId) as any[];

    // Get tasks assigned to team members
    const tasks = db.prepare(`
      SELECT t.id, t.title, t.assignee_id, t.status, t.priority, t.estimate_hours, t.estimate_minutes,
             l.name as list_name
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      WHERE t.assignee_id IN (${members.map(() => '?').join(',')})
    `).all(...members.map(m => m.user_id)) as any[];

    // Calculate workload per member
    const workloadMap: Record<string, {
      name: string;
      email: string;
      role: string;
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      inProgressTasks: number;
      totalEstimatedHours: number;
      priorityDistribution: Record<string, number>;
    }> = {};

    members.forEach(member => {
      workloadMap[member.user_id] = {
        name: member.name,
        email: member.email,
        role: member.role,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        totalEstimatedHours: 0,
        priorityDistribution: { high: 0, medium: 0, low: 0, none: 0 },
      };
    });

    tasks.forEach(task => {
      const member = workloadMap[task.assignee_id];
      if (member) {
        member.totalTasks++;
        if (task.status === 'completed') member.completedTasks++;
        else if (task.status === 'in_progress') member.inProgressTasks++;
        else member.pendingTasks++;

        member.totalEstimatedHours += (task.estimate_hours || 0) + (task.estimate_minutes || 0) / 60;
        const priority = (task.priority || 'none') as 'high' | 'medium' | 'low' | 'none';
        member.priorityDistribution[priority] = (member.priorityDistribution[priority] || 0) + 1;
      }
    });

    // Calculate team statistics
    const totalTasks = tasks.length;
    const totalMembers = members.length;
    const avgTasksPerMember = totalMembers > 0 ? Math.round(totalTasks / totalMembers) : 0;

    return jsonSuccess({
      workload: Object.values(workloadMap),
      summary: {
        totalTasks,
        totalMembers,
        avgTasksPerMember,
        teamBalance: calculateTeamBalance(workloadMap),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch team workload';
    return jsonError(message, 500, 'WORKLOAD_ERROR');
  }
}

function calculateTeamBalance(workloadMap: Record<string, any>): 'balanced' | 'unbalanced' {
  const taskCounts = Object.values(workloadMap).map((m: any) => m.totalTasks);
  if (taskCounts.length === 0) return 'balanced';

  const avg = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
  const maxDeviation = Math.max(...taskCounts.map(c => Math.abs(c - avg)));

  return maxDeviation > avg * 0.5 ? 'unbalanced' : 'balanced';
}

/**
 * POST /api/teams/workload
 * Get task assignment suggestions for a team
 */
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { teamId } = body;

    const db = getDb();

    // Get team members with their current workload
    const members = db.prepare(`
      SELECT tm.user_id, u.name,
             COUNT(t.id) as task_count,
             SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) as high_priority_count
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN tasks t ON tm.user_id = t.assignee_id
      WHERE tm.team_id = ?
      GROUP BY tm.user_id, u.name
    `).all(teamId) as any[];

    // Find the best member for this task
    const sortedMembers = members.sort((a, b) => {
      // Lower task count is better
      if (a.task_count !== b.task_count) {
        return a.task_count - b.task_count;
      }
      // Higher priority tasks go to members with fewer high-priority tasks
      return b.high_priority_count - a.high_priority_count;
    });

    const suggestedMember = sortedMembers[0];

    return jsonSuccess({
      suggestedUserId: suggestedMember.user_id,
      suggestedUserName: suggestedMember.name,
      reason: `Member has ${suggestedMember.task_count} tasks (${suggestedMember.high_priority_count} high priority)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get assignment suggestions';
    return jsonError(message, 500, 'ASSIGNMENT_ERROR');
  }
}

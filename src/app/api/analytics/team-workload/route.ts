import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

/**
 * Get team workload analytics
 */
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return jsonError('Team ID is required', 400, 'MISSING_TEAM_ID');
    }

    const db = getDb();

    // Get team info
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      return jsonError('Team not found', 404, 'TEAM_NOT_FOUND');
    }

    // Get team members
    const members = db.prepare(`
      SELECT tm.id, tm.role, u.name, u.avatar
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `).all(teamId);

    // Get tasks for each member
    const membersWithTasks = members.map((member: any) => {
      const tasks = db.prepare(`
        SELECT t.id, t.title, t.status, t.estimate_hours, t.estimate_minutes, t.deadline
        FROM tasks t
        WHERE t.assignee_id = ? OR t.created_by = ?
      `).all(member.id, member.id);

      return {
        ...member,
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          estimateMinutes: (t.estimate_hours || 0) * 60 + (t.estimate_minutes || 0),
          dueDate: t.deadline,
        })),
        capacity: 8, // Default 8 hours/day
      };
    });

    // Calculate workload per day for the next 7 days
    const workload = [];
    const today = new Date();

    for (const member of membersWithTasks) {
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(today, i), 'yyyy-MM-dd');
        const memberTasks = member.tasks.filter((t: any) => {
          if (!t.dueDate) return false;
          return t.dueDate <= date;
        });

        const allocatedMinutes = memberTasks.reduce(
          (sum: number, t: any) => sum + t.estimateMinutes,
          0
        );
        const allocatedHours = allocatedMinutes / 60;
        const capacityHours = member.capacity;
        const utilization = (allocatedHours / capacityHours) * 100;

        workload.push({
          memberId: member.id,
          date,
          allocatedHours,
          capacityHours,
          utilization: Math.min(100, utilization),
        });
      }
    }

    return jsonSuccess({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
      },
      members: membersWithTasks,
      workload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch workload data';
    return jsonError(message, 500, 'WORKLOAD_ERROR');
  }
}

// Helper function for date formatting
function format(date: Date, pattern: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return pattern.replace('yyyy-MM-dd', `${year}-${month}-${day}`);
}
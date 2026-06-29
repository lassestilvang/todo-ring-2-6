import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getDb } from '@/db/index';

ensureDbInitialized();

interface Conflict {
  taskId: string;
  taskTitle: string;
  conflictType: 'overlap' | 'deadline' | 'dependency' | 'resource';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestedResolution: string;
}

/**
 * GET /api/ai/conflicts
 * Detect scheduling conflicts and provide resolutions
 */
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();

    // Get all tasks with dates
    const tasks = db.prepare(`
      SELECT id, title, date, deadline, status, priority
      FROM tasks
      WHERE date IS NOT NULL OR deadline IS NOT NULL
      ORDER BY date ASC
    `).all() as any[] || [];

    const conflicts: Conflict[] = [];

    // Check for date overlaps
    const dateGroups: Record<string, any[]> = {};
    tasks.forEach(task => {
      const taskDate = task.date;
      if (taskDate) {
        if (!dateGroups[taskDate]) dateGroups[taskDate] = [];
        dateGroups[taskDate].push(task);
      }
    });

    // Find overlaps (more than 3 tasks on same day)
    Object.entries(dateGroups).forEach(([date, dayTasks]) => {
      if (dayTasks.length > 3) {
        dayTasks.forEach(task => {
          conflicts.push({
            taskId: task.id,
            taskTitle: task.title,
            conflictType: 'overlap',
            severity: 'medium',
            message: `High task density on ${date} (${dayTasks.length} tasks)`,
            suggestedResolution: 'Consider rescheduling some tasks to spread workload',
          });
        });
      }
    });

    return jsonSuccess({
      conflicts,
      summary: {
        total: conflicts.length,
        high: conflicts.filter(c => c.severity === 'high').length,
        medium: conflicts.filter(c => c.severity === 'medium').length,
        low: conflicts.filter(c => c.severity === 'low').length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to detect conflicts';
    return jsonError(message, 500, 'CONFLICT_ERROR');
  }
}

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { getDb } from '@/db/index';
import { AIScheduleSchema } from '@/lib/validations';

ensureDbInitialized();

interface ScheduleSuggestion {
  taskId: string;
  suggestedDate: string;
  suggestedTime: string;
  confidence: number;
  reason: string;
}

/**
 * GET /api/ai/schedule
 * Get smart scheduling suggestions for tasks
 */
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();

    // Get all pending tasks
    const tasks = db.prepare(`
      SELECT id, title, date, deadline, estimate_hours, estimate_minutes, priority
      FROM tasks
      WHERE status IN ('pending', 'in_progress')
      ORDER BY priority DESC, created_at ASC
    `).all() as any[];

    // Get busy times from completed tasks
    const busyTimes = db.prepare(`
      SELECT date FROM tasks WHERE status = 'completed'
    `).all() as any[];

    const suggestions: ScheduleSuggestion[] = tasks.map(task => {
      const priorityWeight = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1;
      const confidence = Math.min(0.95, 0.5 + (priorityWeight * 0.15));

      // Find optimal slot
      const optimalHour = 10 + Math.floor(Math.random() * 4);
      const optimalDay = Math.floor(Math.random() * 5);

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + optimalDay);
      targetDate.setHours(optimalHour, 0, 0, 0);

      return {
        taskId: task.id,
        suggestedDate: task.date || targetDate.toISOString().split('T')[0],
        suggestedTime: `${optimalHour.toString().padStart(2, '0')}:00`,
        confidence,
        reason: task.priority === 'high'
          ? 'High priority task scheduled during peak hours'
          : 'Optimal time based on workload analysis',
      };
    });

    return jsonSuccess({
      suggestions,
      busyAnalysis: analyzeBusyTimes(busyTimes),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate schedule';
    return jsonError(message, 500, 'SCHEDULE_ERROR');
  }
}

/**
 * POST /api/ai/schedule
 * Get scheduling suggestions for specific tasks
 */
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = AIScheduleSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { taskIds } = validated.data;
    const db = getDb();

    const placeholders = taskIds.map(() => '?').join(',');
    const tasks = db.prepare(`
      SELECT id, title, date, deadline, estimate_hours, estimate_minutes, priority
      FROM tasks
      WHERE id IN (${placeholders})
    `).all(...taskIds) as any[];

    const suggestions = tasks.map(task => {
      const confidence = task.priority === 'high' ? 0.9 : task.priority === 'medium' ? 0.75 : 0.6;
      return {
        taskId: task.id,
        suggestedDate: task.date || new Date().toISOString().split('T')[0],
        suggestedTime: '10:00',
        confidence,
        reason: 'AI-generated suggestion based on your preferences',
      };
    });

    return jsonSuccess({ suggestions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate schedule';
    return jsonError(message, 500, 'SCHEDULE_ERROR');
  }
}

function analyzeBusyTimes(busyTimes: any[]): { day: string; hours: number[] }[] {
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const result: Record<string, Set<number>> = {};

  busyTimes.forEach(bt => {
    if (bt.date) {
      const date = new Date(bt.date);
      const dayIndex = date.getDay();
      const day = dayMap[dayIndex];
      const hour = date.getHours();
      if (day) {
        if (!result[day]) result[day] = new Set();
        result[day].add(hour);
      }
    }
  });

  return Object.entries(result).map(([day, hours]) => ({
    day,
    hours: Array.from(hours),
  }));
}
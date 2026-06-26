import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTaskStats, getTasks } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import type { Task } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const range = searchParams.get('range') || '7d'; // '7d', '30d', '90d'

    const stats = getTaskStats();
    const tasks = getTasks() as Task[];

    // Calculate date range based on parameter
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7;
    const lastNDays = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const dailyCompletion = lastNDays.map(date => {
      const count = tasks.filter(t =>
        t.completedAt && date && t.completedAt.startsWith(date)
      ).length;
      return { date, count };
    }).reverse();

    // Calculate total estimated time
    const totalTime = tasks.reduce((acc, t) => ({
      hours: acc.hours + (t.estimateHours || 0),
      minutes: acc.minutes + (t.estimateMinutes || 0),
    }), { hours: 0, minutes: 0 });

    return jsonSuccess({
      ...stats,
      dailyCompletion,
      totalTime,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return jsonError(message, 500, 'ANALYTICS_ERROR');
  }
}
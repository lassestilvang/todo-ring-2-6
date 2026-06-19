import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as 'day' | 'week' | 'month' | 'quarter' | 'year') || 'week';
    const userId = searchParams.get('userId') || undefined;

    const tasks = getTasks();
    const now = new Date();

    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = startOfWeek(now);
    }

    const periodStart = format(startDate, 'yyyy-MM-dd');
    const periodEnd = format(endDate, 'yyyy-MM-dd');

    // Filter tasks by date range
    const periodTasks = tasks.filter(task => {
      if (task.date) {
        return task.date >= periodStart && task.date <= periodEnd;
      }
      if (task.createdAt) {
        return task.createdAt >= periodStart && task.createdAt <= periodEnd;
      }
      return true;
    });

    // Calculate time tracking stats
    const totalEstimated = periodTasks.reduce((sum, t) => 
      sum + ((t.estimateHours || 0) * 60 + (t.estimateMinutes || 0)), 0);
    const totalActual = periodTasks.reduce((sum, t) => 
      sum + ((t.actualHours || 0) * 60 + (t.actualMinutes || 0)), 0);

    // Group by list
    const byList = periodTasks.reduce((acc, task) => {
      const listId = task.listId || 'inbox';
      if (!acc[listId]) {
        acc[listId] = { estimated: 0, actual: 0, count: 0 };
      }
      acc[listId].estimated += (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
      acc[listId].actual += (task.actualHours || 0) * 60 + (task.actualMinutes || 0);
      acc[listId].count++;
      return acc;
    }, {} as Record<string, { estimated: number; actual: number; count: number }>);

    // Daily breakdown
    const daily = periodTasks.reduce((acc, task) => {
      const date = task.date || task.createdAt?.split('T')[0] || format(now, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { estimated: 0, actual: 0, completed: 0 };
      }
      acc[date].estimated += (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
      acc[date].actual += (task.actualHours || 0) * 60 + (task.actualMinutes || 0);
      if (task.status === 'completed') acc[date].completed++;
      return acc;
    }, {} as Record<string, { estimated: number; actual: number; completed: number }>);

    return jsonSuccess({
      period,
      periodStart,
      periodEnd,
      summary: {
        totalEstimatedMinutes: totalEstimated,
        totalActualMinutes: totalActual,
        totalTasks: periodTasks.length,
        completionRate: periodTasks.length > 0 
          ? Math.round((periodTasks.filter(t => t.status === 'completed').length / periodTasks.length) * 100)
          : 0,
        efficiency: totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0,
      },
      byList,
      daily,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch time tracking data';
    return jsonError(message, 500, 'TIME_TRACKING_ERROR');
  }
}

import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTaskStats, getTasks } from '@/db/operations';
import type { Task } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

export async function GET() {
  try {
    const stats = getTaskStats();
    const tasks = getTasks();

    // Calculate productivity metrics
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const completionTrend = calculateCompletionTrend(tasks);
    const priorityDistribution = calculatePriorityDistribution(tasks);
    const statusDistribution = {
      pending: stats.pending,
      inProgress: stats.inProgress,
      completed: stats.completed,
      cancelled: 0, // Would need to query for this
    };

    // Calculate average completion time
    const avgCompletionTime = calculateAvgCompletionTime(tasks);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          ...stats,
          completionRate,
        },
        productivity: {
          completionTrend,
          priorityDistribution,
          statusDistribution,
          avgCompletionTime,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}

function calculateCompletionTrend(tasks: Task[]): { date: string; completed: number }[] {
  const today = new Date();
  const trend: { date: string; completed: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0] ?? '';

    const completed = tasks.filter(t =>
      t.status === 'completed' &&
      t.completedAt &&
      t.completedAt.startsWith(dateStr)
    ).length;

    trend.push({ date: dateStr, completed });
  }

  return trend;
}

function calculatePriorityDistribution(tasks: Task[]): { high: number; medium: number; low: number; none: number } {
  return tasks.reduce((acc, task) => {
    acc[task.priority]++;
    return acc;
  }, { high: 0, medium: 0, low: 0, none: 0 });
}

function calculateAvgCompletionTime(tasks: Task[]): number {
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
  if (completedTasks.length === 0) return 0;

  const totalMinutes = completedTasks.reduce((sum, task) => {
    const start = new Date(task.createdAt).getTime();
    const end = new Date(task.completedAt!).getTime();
    return sum + (end - start) / (1000 * 60);
  }, 0);

  return Math.round(totalMinutes / completedTasks.length);
}
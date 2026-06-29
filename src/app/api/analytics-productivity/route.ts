import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, getTaskStats } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { format, subDays } from 'date-fns';
import type { Task } from '@/types/index';

ensureDbInitialized();

interface Insight {
  id: string;
  type: 'productivity' | 'pattern' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metric?: string;
  createdAt: string;
}

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const period = (searchParams.get('period') as 'day' | 'week' | 'month') || 'week';

    const tasks = getTasks() as Task[];
    const stats = getTaskStats();
    const now = new Date();

    // Calculate date range
    const startDate = period === 'day' 
      ? format(now, 'yyyy-MM-dd')
      : period === 'week'
        ? format(subDays(now, 7), 'yyyy-MM-dd')
        : format(subDays(now, 30), 'yyyy-MM-dd');

    // Filter tasks by period
    const periodTasks = tasks.filter(t => 
      t.createdAt && t.createdAt >= startDate
    );

    const insights: Insight[] = [];

    // Completion rate insight
    const completionRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;
    
    if (completionRate < 50) {
      insights.push({
        id: 'low-completion',
        type: 'recommendation',
        priority: 'high',
        title: 'Low Completion Rate',
        description: `Your completion rate is ${completionRate}%. Focus on completing high-priority tasks first.`,
        metric: `${completionRate}%`,
        createdAt: now.toISOString(),
      });
    }

    // Productivity pattern analysis
    const completedByDay = periodTasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .reduce((acc, t) => {
        const day = new Date(t.completedAt!).getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const bestDay = Object.entries(completedByDay)
      .sort(([,a], [,b]) => b - a)[0];

    if (bestDay) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      insights.push({
        id: 'best-day',
        type: 'pattern',
        priority: 'medium',
        title: 'Most Productive Day',
        description: `You complete the most tasks on ${dayNames[parseInt(bestDay[0])]}s.`,
        metric: `${bestDay[1]} tasks`,
        createdAt: now.toISOString(),
      });
    }

    // Prediction: Estimate completion time
    const avgCompletionTime = periodTasks
      .filter(t => t.status === 'completed' && t.completedAt && t.createdAt)
      .reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60);
      }, 0) / Math.max(1, periodTasks.filter(t => t.status === 'completed').length);

    if (avgCompletionTime > 0) {
      insights.push({
        id: 'avg-time',
        type: 'prediction',
        priority: 'low',
        title: 'Average Task Duration',
        description: `${avgCompletionTime.toFixed(1)} hours on average to complete tasks.`,
        metric: `${avgCompletionTime.toFixed(1)}h`,
        createdAt: now.toISOString(),
      });
    }

    // Recommendation: Break down large tasks
    const largeTasks = periodTasks.filter(t => 
      (t.estimateHours || 0) > 4 || (t.estimateMinutes || 0) > 120
    );
    if (largeTasks.length > 0) {
      insights.push({
        id: 'large-tasks',
        type: 'recommendation',
        priority: 'medium',
        title: 'Break Down Large Tasks',
        description: `${largeTasks.length} tasks are estimated to take more than 2 hours. Consider breaking them into smaller subtasks.`,
        metric: `${largeTasks.length} tasks`,
        createdAt: now.toISOString(),
      });
    }

    return jsonSuccess({
      period,
      insights: [...insights],
      generatedAt: now.toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate insights';
    return jsonError(message, 500, 'INSIGHTS_ERROR');
  }
}

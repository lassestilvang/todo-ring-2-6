import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, getTaskStats, getOverdueCount } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Ensure database is initialized
ensureDbInitialized();

interface AnalyticsParams {
  range: 'day' | 'week' | 'month' | 'quarter' | 'year';
  listId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') as AnalyticsParams['range']) || 'week';
    const listId = searchParams.get('listId') || undefined;

    const tasks = getTasks();
    const stats = getTaskStats();
    const overdueCount = getOverdueCount();

    // Calculate date range
    const { startDate, endDate } = getDateRange(range);

    // Filter tasks by date range and optionally by list
    const filteredTasks = tasks.filter(task => {
      if (listId && task.listId !== listId) return false;
      if (task.date && task.date >= startDate && task.date <= endDate) return true;
      if (task.createdAt && task.createdAt >= startDate && task.createdAt <= endDate) return true;
      return false;
    });

    // Calculate metrics
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const overdueRate = stats.total > 0 ? Math.round((overdueCount / stats.total) * 100) : 0;

    // Daily completion trend
    const dailyCompletion = getDailyCompletion(filteredTasks, startDate, endDate);

    // Priority distribution
    const priorityDistribution = getPriorityDistribution(filteredTasks);

    // Time tracking analysis
    const timeTracking = getTimeTrackingAnalysis(filteredTasks);

    // List performance
    const listPerformance = getListPerformance(filteredTasks);

    // Hourly productivity pattern
    const hourlyPattern = getHourlyProductivityPattern(filteredTasks);

    // Streak data
    const streakData = getStreakData(filteredTasks);

    return jsonSuccess({
      range,
      startDate,
      endDate,
      summary: {
        total: filteredTasks.length,
        completed: filteredTasks.filter(t => t.status === 'completed').length,
        pending: filteredTasks.filter(t => t.status === 'pending').length,
        inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
        completionRate,
        overdueCount,
        overdueRate,
      },
      dailyCompletion,
      priorityDistribution,
      timeTracking,
      listPerformance,
      hourlyPattern,
      streakData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comprehensive analytics';
    return jsonError(message, 500, 'ANALYTICS_ERROR');
  }
}

function getDateRange(range: string): { startDate: string; endDate: string } {
  const today = format(new Date(), 'yyyy-MM-dd');

  switch (range) {
    case 'day':
      return { startDate: today, endDate: today };
    case 'week':
      return {
        startDate: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
        endDate: today
      };
    case 'month':
      return {
        startDate: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
        endDate: today
      };
    case 'quarter':
      return {
        startDate: format(subDays(new Date(), 89), 'yyyy-MM-dd'),
        endDate: today
      };
    case 'year':
      return {
        startDate: format(subDays(new Date(), 364), 'yyyy-MM-dd'),
        endDate: today
      };
    default:
      return { startDate: today, endDate: today };
  }
}

function getDailyCompletion(tasks: any[], startDate: string, endDate: string): { date: string; completed: number; created: number }[] {
  const days: { date: string; completed: number; created: number }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < dayCount; i++) {
    const date = format(new Date(start.getTime() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const completed = tasks.filter(t =>
      t.status === 'completed' && t.completedAt && t.completedAt.startsWith(date)
    ).length;
    const created = tasks.filter(t => t.createdAt && t.createdAt.startsWith(date)).length;
    days.push({ date, completed, created });
  }

  return days;
}

function getPriorityDistribution(tasks: any[]): { high: number; medium: number; low: number; none: number; completed: { high: number; medium: number; low: number; none: number } } {
  const distribution = { high: 0, medium: 0, low: 0, none: 0 };
  const completed = { high: 0, medium: 0, low: 0, none: 0 };

  tasks.forEach(task => {
    const priority = task.priority || 'none';
    if (priority in distribution) {
      distribution[priority as keyof typeof distribution]++;
      if (task.status === 'completed') {
        completed[priority as keyof typeof completed]++;
      }
    }
  });

  return { ...distribution, completed };
}

function getTimeTrackingAnalysis(tasks: any[]): {
  totalEstimated: { hours: number; minutes: number };
  totalActual: { hours: number; minutes: number };
  avgEstimatedPerTask: { hours: number; minutes: number };
  avgActualPerTask: { hours: number; minutes: number };
  underEstimation: number;
  overEstimation: number;
} {
  const estimated = tasks.reduce((acc, t) => ({
    hours: acc.hours + (t.estimateHours || 0),
    minutes: acc.minutes + (t.estimateMinutes || 0),
  }), { hours: 0, minutes: 0 });

  const actual = tasks.reduce((acc, t) => ({
    hours: acc.hours + (t.actualHours || 0),
    minutes: acc.minutes + (t.actualMinutes || 0),
  }), { hours: 0, minutes: 0 });

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const avgEstimated = completedTasks.length > 0 ? {
    hours: Math.floor(estimated.hours / completedTasks.length),
    minutes: Math.floor(estimated.minutes / completedTasks.length),
  } : { hours: 0, minutes: 0 };

  const avgActual = completedTasks.length > 0 ? {
    hours: Math.floor(actual.hours / completedTasks.length),
    minutes: Math.floor(actual.minutes / completedTasks.length),
  } : { hours: 0, minutes: 0 };

  // Count under/over estimations
  let underEstimation = 0;
  let overEstimation = 0;
  completedTasks.forEach(t => {
    const estimatedMinutes = (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
    const actualMinutes = (t.actualHours || 0) * 60 + (t.actualMinutes || 0);
    if (actualMinutes < estimatedMinutes) underEstimation++;
    else if (actualMinutes > estimatedMinutes) overEstimation++;
  });

  return {
    totalEstimated: estimated,
    totalActual: actual,
    avgEstimatedPerTask: avgEstimated,
    avgActualPerTask: avgActual,
    underEstimation,
    overEstimation,
  };
}

function getListPerformance(tasks: any[]): { listId: string; listName: string; total: number; completed: number; rate: number }[] {
  const listMap = new Map<string, { total: number; completed: number }>();

  tasks.forEach(task => {
    const listId = task.listId || 'inbox';
    if (!listMap.has(listId)) {
      listMap.set(listId, { total: 0, completed: 0 });
    }
    const stats = listMap.get(listId)!;
    stats.total++;
    if (task.status === 'completed') stats.completed++;
  });

  return Array.from(listMap.entries()).map(([listId, stats]) => ({
    listId,
    listName: tasks.find(t => t.listId === listId)?.listName || 'Unknown',
    total: stats.total,
    completed: stats.completed,
    rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }));
}

function getHourlyProductivityPattern(tasks: any[]): { hour: number; completed: number }[] {
  const hourCounts = new Array(24).fill(0).map(() => ({ hour: 0, completed: 0 }));

  tasks.filter(t => t.status === 'completed' && t.completedAt).forEach(task => {
    const hour = new Date(task.completedAt).getHours();
    hourCounts[hour].hour = hour;
    hourCounts[hour].completed++;
  });

  return hourCounts;
}

function getStreakData(tasks: any[]): { currentStreak: number; bestStreak: number; streakDates: string[] } {
  const completedDates = new Set(
    tasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .map(t => format(new Date(t.completedAt), 'yyyy-MM-dd'))
  );

  let currentStreak = 0;
  let bestStreak = 0;
  const streakDates: string[] = [];

  const today = format(new Date(), 'yyyy-MM-dd');
  const checkDate = new Date(today);

  while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
    streakDates.push(format(checkDate, 'yyyy-MM-dd'));
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate best streak from all time
  const allDates = Array.from(completedDates).sort();
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of allDates) {
    const date = new Date(dateStr);
    if (lastDate) {
      const diff = Math.round((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
      bestStreak = Math.max(bestStreak, 1);
    }
    lastDate = date;
  }

  return { currentStreak, bestStreak, streakDates };
}
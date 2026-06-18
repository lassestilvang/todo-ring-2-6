import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, getTaskStats } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { format, subDays, parseISO } from 'date-fns';

// Ensure database is initialized
ensureDbInitialized();

interface Insight {
  id: string;
  type: 'productivity' | 'completion' | 'time' | 'pattern';
  title: string;
  description: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') as string) || 'week';

    const tasks = getTasks();
    const stats = getTaskStats();

    const insights: Insight[] = [];

    // 1. Completion Rate Insight
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    const previousCompletionRate = getPreviousPeriodCompletion(tasks, range);
    insights.push({
      id: 'completion-rate',
      type: 'completion',
      title: 'Completion Rate',
      description: `You've completed ${Math.round(completionRate)}% of your tasks`,
      value: Math.round(completionRate),
      trend: completionRate > previousCompletionRate ? 'up' : completionRate < previousCompletionRate ? 'down' : 'neutral',
      icon: '🎯',
    });

    // 2. Daily Average
    const daysInPeriod = getDaysInPeriod(range);
    const dailyAverage = stats.completed / daysInPeriod;
    const previousDaily = getPreviousPeriodDailyAverage(tasks, range);
    insights.push({
      id: 'daily-average',
      type: 'productivity',
      title: 'Daily Completion',
      description: `${dailyAverage.toFixed(1)} tasks completed per day on average`,
      value: Math.round(dailyAverage * 10) / 10,
      trend: dailyAverage > previousDaily ? 'up' : dailyAverage < previousDaily ? 'down' : 'neutral',
      icon: '📊',
    });

    // 3. Best Day
    const bestDay = getBestDay(stats.total > 0 ? tasks : []);
    insights.push({
      id: 'best-day',
      type: 'pattern',
      title: 'Most Productive Day',
      description: `You're most productive on ${bestDay.day}`,
      value: bestDay.count,
      trend: 'neutral',
      icon: '🏆',
    });

    // 4. Overdue Tasks
    const overdueRate = stats.total > 0 ? (stats.overdueCount / stats.total) * 100 : 0;
    insights.push({
      id: 'overdue-rate',
      type: 'completion',
      title: 'Overdue Rate',
      description: `${Math.round(overdueRate)}% of tasks are overdue`,
      value: Math.round(overdueRate),
      trend: overdueRate > 10 ? 'down' : overdueRate < 5 ? 'up' : 'neutral',
      icon: overdueRate > 10 ? '🔴' : overdueRate < 5 ? '🟢' : '🟡',
    });

    // 5. Time Tracking Efficiency
    const timeEfficiency = getTimeEfficiency(tasks);
    insights.push({
      id: 'time-efficiency',
      type: 'time',
      title: 'Time Tracking',
      description: `${timeEfficiency.onTrack}% of tracked tasks are on schedule`,
      value: timeEfficiency.onTrack,
      trend: timeEfficiency.onTrack > 70 ? 'up' : timeEfficiency.onTrack < 50 ? 'down' : 'neutral',
      icon: '⏱️',
    });

    // 6. Streak
    const streak = getCurrentStreak(tasks);
    insights.push({
      id: 'current-streak',
      type: 'productivity',
      title: 'Current Streak',
      description: `${streak} days of consecutive completions`,
      value: streak,
      trend: streak > 7 ? 'up' : streak > 0 ? 'neutral' : 'down',
      icon: '🔥',
    });

    return jsonSuccess({ insights, summary: { totalTasks: stats.total, completedTasks: stats.completed } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch insights';
    return jsonError(message, 500, 'INSIGHTS_ERROR');
  }
}

function getDaysInPeriod(range: string): number {
  switch (range) {
    case 'day': return 1;
    case 'week': return 7;
    case 'month': return 30;
    case 'quarter': return 90;
    case 'year': return 365;
    default: return 7;
  }
}

function getPreviousPeriodCompletion(tasks: any[], range: string): number {
  // Simplified: calculate completion for previous period
  const days = getDaysInPeriod(range);
  const today = new Date();
  const previousStart = new Date(today.getTime() - 2 * days * 24 * 60 * 60 * 1000);
  const currentStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

  const previousTasks = tasks.filter(t => {
    if (!t.completedAt) return false;
    const completed = parseISO(t.completedAt);
    return completed >= previousStart && completed < currentStart;
  });

  const previousTotal = previousTasks.length;
  const previousCompleted = previousTasks.filter(t => t.status === 'completed').length;

  return previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;
}

function getPreviousPeriodDailyAverage(tasks: any[], range: string): number {
  const days = getDaysInPeriod(range);
  const today = new Date();
  const previousStart = new Date(today.getTime() - 2 * days * 24 * 60 * 60 * 1000);
  const currentStart = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

  const previousTasks = tasks.filter(t => {
    if (!t.completedAt) return false;
    const completed = parseISO(t.completedAt);
    return completed >= previousStart && completed < currentStart;
  });

  return previousTasks.length / days;
}

function getBestDay(tasks: any[]): { day: string; count: number } {
  const dayCounts: Record<string, number> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  tasks.filter(t => t.status === 'completed' && t.completedAt).forEach(task => {
    const day = dayNames[new Date(task.completedAt).getDay()];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const bestDay = Object.entries(dayCounts).reduce((max, [day, count]) =>
    count > max.count ? { day, count } : max, { day: 'N/A', count: 0 }
  );

  return bestDay;
}

function getTimeEfficiency(tasks: any[]): { onTrack: number; under: number; over: number } {
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.estimateHours);

  if (completedTasks.length === 0) {
    return { onTrack: 0, under: 0, over: 0 };
  }

  let onTrack = 0;
  let under = 0;
  let over = 0;

  completedTasks.forEach(task => {
    const estimated = (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
    const actual = (task.actualHours || 0) * 60 + (task.actualMinutes || 0);

    if (actual <= estimated) onTrack++;
    else if (actual <= estimated * 1.5) under++;
    else over++;
  });

  const total = completedTasks.length;
  return {
    onTrack: Math.round((onTrack / total) * 100),
    under: Math.round((under / total) * 100),
    over: Math.round((over / total) * 100),
  };
}

function getCurrentStreak(tasks: any[]): number {
  const completedDates = new Set(
    tasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .map(t => format(new Date(t.completedAt), 'yyyy-MM-dd'))
  );

  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const checkDate = new Date(today);

  while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
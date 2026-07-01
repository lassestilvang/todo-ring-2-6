/**
 * AI Analytics Service
 * Provides intelligent insights and predictions based on task data
 */

import { getDb } from '@/lib/db-client';

export interface ProductivityInsight {
  type: 'productivity' | 'completion' | 'schedule' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  data?: Record<string, any>;
}

export interface ProductivityPattern {
  name: string;
  value: number;
  description: string;
  recommendation: string;
}

/**
 * Analyze user productivity patterns
 */
export function analyzeProductivity(userId: string): ProductivityInsight[] {
  const db = getDb();
  const insights: ProductivityInsight[] = [];

  // Get task completion data
  const completionData = db
    .prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `)
    .all(userId) as { date: string; total: number; completed: number }[];

  // Calculate completion rate trend
  if (completionData.length >= 2) {
    const firstHalf = completionData.slice(0, Math.floor(completionData.length / 2));
    const secondHalf = completionData.slice(Math.floor(completionData.length / 2));

    const firstRate = firstHalf.reduce((sum, d) => sum + (d.total > 0 ? d.completed / d.total : 0), 0) / firstHalf.length;
    const secondRate = secondHalf.reduce((sum, d) => sum + (d.total > 0 ? d.completed / d.total : 0), 0) / secondHalf.length;

    if (secondRate > firstRate) {
      insights.push({
        type: 'productivity',
        title: 'Improving Productivity',
        description: `Your completion rate has improved by ${Math.round((secondRate - firstRate) * 100)}% over the last 30 days.`,
        confidence: 0.85,
        data: { before: Math.round(firstRate * 100), after: Math.round(secondRate * 100) }
      });
    }
  }

  // Analyze priority effectiveness
  const priorityStats = db
    .prepare(`
      SELECT
        priority,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY priority
    `)
    .all(userId) as { priority: string; total: number; completed: number }[];

  const highPriorityRate = priorityStats
    .filter(s => s.priority === 'high' || s.priority === 'medium')
    .reduce((sum, s) => sum + (s.total > 0 ? s.completed / s.total : 0), 0);

  if (highPriorityRate < 0.7) {
    insights.push({
      type: 'recommendation',
      title: 'Priority Management',
      description: 'Consider focusing on high-priority tasks earlier in your day for better completion rates.',
      confidence: 0.75
    });
  }

  // Analyze time-based patterns
  const hourlyData = db
    .prepare(`
      SELECT
        strftime('%H', created_at) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `)
    .all(userId) as { hour: string; total: number; completed: number }[];

  const bestHour = hourlyData.reduce((best, current) => {
    const rate = current.total > 0 ? current.completed / current.total : 0;
    const bestRate = best.total > 0 ? best.completed / best.total : 0;
    return rate > bestRate ? current : best;
  }, { hour: '09', total: 0, completed: 0 });

  if (parseInt(bestHour.hour) > 0) {
    insights.push({
      type: 'pattern',
      title: 'Peak Productivity Hour',
      description: `You're most productive around ${bestHour.hour}:00. Consider scheduling important tasks during this time.`,
      confidence: 0.8,
      data: { hour: parseInt(bestHour.hour) }
    });
  }

  return insights;
}

/**
 * Get personalized productivity patterns
 */
export function getProductivityPatterns(userId: string): ProductivityPattern[] {
  const db = getDb();
  const patterns: ProductivityPattern[] = [];

  // Completion rate by day of week
  const weeklyData = db
    .prepare(`
      SELECT
        strftime('%w', created_at) as day,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
      WHERE user_id = ? AND created_at >= datetime('now', '-60 days')
      GROUP BY strftime('%w', created_at)
    `)
    .all(userId) as { day: string; total: number; completed: number }[];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  weeklyData.forEach(d => {
    const rate = d.total > 0 ? d.completed / d.total : 0;
    patterns.push({
      name: `${dayNames[parseInt(d.day)]} Completion Rate`,
      value: Math.round(rate * 100),
      description: `${Math.round(rate * 100)}% of tasks completed`,
      recommendation: rate < 0.5 ? `Review your ${dayNames[parseInt(d.day)]} schedule` : 'Keep up the good work!'
    });
  });

  // Task aging analysis
  const agingData = db
    .prepare(`
      SELECT
        CASE
          WHEN julianday(deadline) - julianday('now') <= 1 THEN 'due-today'
          WHEN julianday(deadline) - julianday('now') <= 3 THEN 'due-soon'
          WHEN julianday(deadline) - julianday('now') > 3 THEN 'due-later'
          ELSE 'no-deadline'
        END as deadline_category,
        COUNT(*) as total
      FROM tasks
      WHERE user_id = ? AND deadline IS NOT NULL AND status != 'completed'
      GROUP BY 1
    `)
    .all(userId) as { deadline_category: string; total: number }[];

  const dueSoon = agingData.find(d => d.deadline_category === 'due-soon')?.total || 0;
  if (dueSoon > 5) {
    patterns.push({
      name: 'Upcoming Deadlines',
      value: dueSoon,
      description: `${dueSoon} tasks due within 3 days`,
      recommendation: 'Consider delegating or prioritizing these tasks'
    });
  }

  return patterns;
}

/**
 * Generate smart task suggestions
 */
export function generateTaskSuggestions(userId: string, count: number = 3): any[] {
  const db = getDb();

  // Get incomplete tasks with no deadline
  const suggestionPool = db
    .prepare(`
      SELECT id, title, priority, created_at
      FROM tasks
      WHERE user_id = ? AND status != 'completed' AND deadline IS NULL
      ORDER BY priority DESC, created_at ASC
      LIMIT 10
    `)
    .all(userId) as { id: string; title: string; priority: string; created_at: string }[];

  return suggestionPool.slice(0, count).map(task => ({
    id: task.id,
    title: task.title,
    action: 'add-deadline',
    reason: `This ${task.priority} priority task could benefit from a deadline`
  }));
}

/**
 * Predict completion time for a task
 */
export function predictCompletionTime(userId: string, taskId: string): {
  estimatedDays: number;
  confidence: number;
} {
  const db = getDb();

  // Get similar tasks (same list, similar priority)
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) return { estimatedDays: 0, confidence: 0 };

  const similarTasks = db
    .prepare(`
      SELECT actual_hours, actual_minutes, completed_at, created_at
      FROM tasks
      WHERE user_id = ? AND status = 'completed' AND priority = ?
      AND created_at >= datetime('now', '-90 days')
    `)
    .all(userId, task.priority) as { actual_hours: number; actual_minutes: number; completed_at: string; created_at: string }[];

  if (similarTasks.length === 0) {
    return { estimatedDays: 3, confidence: 0.3 };
  }

  const avgMinutes = similarTasks.reduce((sum, t) => sum + (t.actual_hours * 60 + t.actual_minutes), 0) / similarTasks.length;
  const estimatedDays = Math.ceil(avgMinutes / 60 / 8); // Assuming 8 hours/day

  return {
    estimatedDays: Math.max(1, estimatedDays),
    confidence: Math.min(0.95, 0.5 + (similarTasks.length / 20))
  };
}
import { isPast, parseISO, format, isToday, isTomorrow } from 'date-fns';
import type { Task } from '@/types/index';

export interface TaskAging {
  ageDays: number;
  ageCategory: 'new' | 'recent' | 'aging' | 'old' | 'stale';
  opacity: number;
  isOverdue: boolean;
}

// Age thresholds in days
const AGE_THRESHOLDS = {
  NEW: 2,        // 0-2 days: new
  RECENT: 7,     // 3-7 days: recent
  AGING: 30,     // 8-30 days: aging
  OLD: 90,       // 31-90 days: old
  // 90+ days: stale
};

export function getTaskAging(task: {
  createdAt: string;
  deadline?: string | null;
  status: string;
}): TaskAging {
  const now = new Date();
  const created = parseISO(task.createdAt);
  const ageDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  let ageCategory: TaskAging['ageCategory'] = 'new';
  let opacity = 1;
  const isOverdue = task.deadline && isPast(parseISO(task.deadline)) && task.status !== 'completed';

  if (ageDays <= AGE_THRESHOLDS.NEW) {
    ageCategory = 'new';
    opacity = 1;
  } else if (ageDays <= AGE_THRESHOLDS.RECENT) {
    ageCategory = 'recent';
    opacity = 0.95;
  } else if (ageDays <= AGE_THRESHOLDS.AGING) {
    ageCategory = 'aging';
    opacity = 0.85;
  } else if (ageDays <= AGE_THRESHOLDS.OLD) {
    ageCategory = 'old';
    opacity = 0.7;
  } else {
    ageCategory = 'stale';
    opacity = 0.5;
  }

  return {
    ageDays,
    ageCategory,
    opacity: task.status === 'completed' ? opacity * 0.7 : opacity,
    isOverdue: !!isOverdue,
  };
}

export function getAgeLabel(ageCategory: string): string {
  switch (ageCategory) {
    case 'new': return 'New';
    case 'recent': return 'Recent';
    case 'aging': return 'Aging';
    case 'old': return 'Old';
    case 'stale': return 'Stale';
    default: return '';
  }
}

/**
 * Format task date for display
 */
export function formatTaskDate(date: string | null | undefined): string {
  if (!date) return 'No date';

  const parsed = parseISO(date);

  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';

  return format(parsed, 'MMM d');
}

/**
 * Format task deadline with overdue detection
 */
export function formatTaskDeadline(deadline: string | null | undefined): { text: string; isOverdue: boolean } {
  if (!deadline) return { text: 'No deadline', isOverdue: false };

  const parsed = parseISO(deadline);
  const isOverdue = isPast(parsed) && !isToday(parsed);

  return {
    text: isOverdue ? `Overdue (${format(parsed, 'MMM d')})` : `Due ${format(parsed, 'MMM d')}`,
    isOverdue,
  };
}

/**
 * Get task status display info
 */
export function getTaskStatusInfo(status: Task['status']) {
  const config = {
    pending: { label: 'Pending', color: 'text-muted-foreground', icon: '○' },
    in_progress: { label: 'In Progress', color: 'text-blue-500', icon: '◐' },
    completed: { label: 'Completed', color: 'text-emerald-500', icon: '●' },
    cancelled: { label: 'Cancelled', color: 'text-red-500', icon: '⊘' },
  };
  return config[status] || config.pending;
}

/**
 * Get priority level for sorting (lower = higher priority)
 */
export function getPriorityLevel(priority: 'high' | 'medium' | 'low' | 'none'): number {
  const levels: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
    none: 3,
  };
  return levels[priority] ?? 3;
}
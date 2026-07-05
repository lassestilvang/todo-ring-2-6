/**
 * Focus Time Budgets
 * Daily/weekly focus hours allocation with burnout prevention
 */

import { getDb } from '../db/index';

export interface FocusTimeBudget {
  id: string;
  userId: string;
  dailyLimit: number;        // Daily focus hours limit
  weeklyLimit: number;       // Weekly focus hours limit
  workStartHour: number;     // Default: 9
  workEndHour: number;       // Default: 17
  quietHoursStart: string;   // Default: '22:00'
  quietHoursEnd: string;     // Default: '08:00'
  burnoutWarningThreshold: number; // Warn at 80% of daily limit
  created_at: string;
  updated_at: string;
}

export interface FocusTimeStats {
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
  remainingMinutes: number;
  isOverdue: boolean;
}

export class FocusTimeBudgets {
  private db = getDb();

  /**
   * Get focus time budget for a user
   */
  getBudget(userId: string): FocusTimeBudget | undefined {
    return this.db.prepare(
      'SELECT * FROM focus_time_budgets WHERE user_id = ?'
    ).get(userId) as FocusTimeBudget | undefined;
  }

  /**
   * Create or update focus time budget
   */
  upsert(userId: string, data: Partial<Omit<FocusTimeBudget, 'id' | 'userId' | 'created_at' | 'updated_at'>>): FocusTimeBudget {
    const existing = this.getBudget(userId);
    const now = new Date().toISOString();

    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];

      const fields: (keyof typeof data)[] = [
        'dailyLimit', 'weeklyLimit', 'workStartHour', 'workEndHour',
        'quietHoursStart', 'quietHoursEnd', 'burnoutWarningThreshold'
      ];

      for (const field of fields) {
        if (data[field] !== undefined) {
          updates.push(`${this.toSnakeCase(field)} = ?`);
          values.push(data[field]);
        }
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(userId);

      this.db.prepare(`UPDATE focus_time_budgets SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
      return this.getBudget(userId)!;
    }

    const id = crypto.randomUUID();
    const defaultValues = {
      dailyLimit: data.dailyLimit ?? 8,
      weeklyLimit: data.weeklyLimit ?? 40,
      workStartHour: data.workStartHour ?? 9,
      workEndHour: data.workEndHour ?? 17,
      quietHoursStart: data.quietHoursStart ?? '22:00',
      quietHoursEnd: data.quietHoursEnd ?? '08:00',
      burnoutWarningThreshold: data.burnoutWarningThreshold ?? 0.8,
    };

    this.db.prepare(
      'INSERT INTO focus_time_budgets (id, user_id, daily_limit, weekly_limit, work_start_hour, work_end_hour, quiet_hours_start, quiet_hours_end, burnout_warning_threshold, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, defaultValues.dailyLimit, defaultValues.weeklyLimit, defaultValues.workStartHour,
          defaultValues.workEndHour, defaultValues.quietHoursStart, defaultValues.quietHoursEnd,
          defaultValues.burnoutWarningThreshold, now, now);

    return this.getBudget(userId)!;
  }

  /**
   * Delete focus time budget
   */
  delete(userId: string): boolean {
    const result = this.db.prepare('DELETE FROM focus_time_budgets WHERE user_id = ?').run(userId);
    return result.changes > 0;
  }

  /**
   * Get daily stats for a user
   */
  getDailyStats(userId: string, date: string): FocusTimeStats {
    const budget = this.getBudget(userId);
    const dailyLimit = (budget?.dailyLimit || 8) * 60; // Convert to minutes

    // Get actual focus time from focus_sessions
    const actualResult = this.db.prepare(
      "SELECT SUM(duration) as total FROM focus_sessions WHERE user_id = ? AND DATE(started_at) = ? AND status = 'completed'"
    ).get(userId, date) as { total: number } | undefined;

    const actualMinutes = actualResult?.total || 0;
    const remainingMinutes = Math.max(0, dailyLimit - actualMinutes);
    const isOverdue = actualMinutes > dailyLimit;

    // Get planned time from time_blocks
    const plannedResult = this.db.prepare(
      "SELECT SUM(strftime('%s', end_time) - strftime('%s', start_time)) / 60 as total FROM time_blocks WHERE user_id = ? AND DATE(start_time) = ?"
    ).get(userId, date) as { total: number } | undefined;

    const plannedMinutes = plannedResult?.total || 0;

    return {
      date,
      plannedMinutes,
      actualMinutes,
      remainingMinutes,
      isOverdue
    };
  }

  /**
   * Get weekly stats for a user
   */
  getWeeklyStats(userId: string, weekStart: string): {
    totalPlanned: number;
    totalActual: number;
    totalRemaining: number;
    dailyBreakdown: FocusTimeStats[];
  } {
    const budget = this.getBudget(userId);
    const weeklyLimit = (budget?.weeklyLimit || 40) * 60; // Convert to minutes

    const dailyBreakdown: FocusTimeStats[] = [];
    let totalPlanned = 0;
    let totalActual = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const stats = this.getDailyStats(userId, dateStr);
      dailyBreakdown.push(stats);
      totalPlanned += stats.plannedMinutes;
      totalActual += stats.actualMinutes;
    }

    return {
      totalPlanned,
      totalActual,
      totalRemaining: Math.max(0, weeklyLimit - totalActual),
      dailyBreakdown
    };
  }

  /**
   * Check if user is at risk of burnout
   */
  checkBurnoutRisk(userId: string): {
    isAtRisk: boolean;
    dailyUsage: number;
    warningThreshold: number;
    message?: string;
  } {
    const budget = this.getBudget(userId);
    if (!budget) {
      return { isAtRisk: false, dailyUsage: 0, warningThreshold: 0.8 };
    }

    const today = new Date().toISOString().split('T')[0];
    const stats = this.getDailyStats(userId, today);
    const dailyUsage = stats.actualMinutes / (budget.dailyLimit * 60);
    const threshold = budget.burnoutWarningThreshold;

    if (dailyUsage >= threshold) {
      return {
        isAtRisk: true,
        dailyUsage,
        warningThreshold: threshold,
        message: `You've used ${Math.round(dailyUsage * 100)}% of your daily focus budget. Consider taking a break.`
      };
    }

    return { isAtRisk: false, dailyUsage, warningThreshold: threshold };
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

let focusTimeBudgetsInstance: FocusTimeBudgets | null = null;

export function getFocusTimeBudgets(): FocusTimeBudgets {
  if (!focusTimeBudgetsInstance) {
    focusTimeBudgetsInstance = new FocusTimeBudgets();
  }
  return focusTimeBudgetsInstance;
}
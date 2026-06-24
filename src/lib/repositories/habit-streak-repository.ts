/**
 * Habit Streak Repository
 * Handles all database operations related to habit streaks
 */

import { getDb } from '../../db/index';
import type { HabitStreak } from '@/types/index';

export class HabitStreakRepository {
  private db = getDb();

  findByTaskId(taskId: string): HabitStreak | undefined {
    return this.db.prepare('SELECT * FROM habit_streaks WHERE task_id = ?').get(taskId) as HabitStreak | undefined;
  }

  findById(id: string): HabitStreak | undefined {
    return this.db.prepare('SELECT * FROM habit_streaks WHERE id = ?').get(id) as HabitStreak | undefined;
  }

  findAll(): HabitStreak[] {
    return this.db.prepare('SELECT * FROM habit_streaks ORDER BY current_streak DESC').all() as HabitStreak[];
  }

  create(taskId: string): HabitStreak {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO habit_streaks (id, task_id, current_streak, longest_streak, last_completed, streak_start, created_at, updated_at) VALUES (?, ?, 0, 0, NULL, NULL, ?, ?)'
    ).run(id, taskId, now, now);

    return this.findById(id)!;
  }

  update(taskId: string, data: Partial<{
    currentStreak: number;
    longestStreak: number;
    lastCompleted: string;
    streakStart: string;
  }>): HabitStreak {
    const streak = this.findByTaskId(taskId);
    if (!streak) throw new Error('Habit streak not found');

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.currentStreak !== undefined) { updates.push('current_streak = ?'); values.push(data.currentStreak); }
    if (data.longestStreak !== undefined) { updates.push('longest_streak = ?'); values.push(data.longestStreak); }
    if (data.lastCompleted !== undefined) { updates.push('last_completed = ?'); values.push(data.lastCompleted); }
    if (data.streakStart !== undefined) { updates.push('streak_start = ?'); values.push(data.streakStart); }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(taskId);

    this.db.prepare(`UPDATE habit_streaks SET ${updates.join(', ')} WHERE task_id = ?`).run(...values);

    return this.findByTaskId(taskId)!;
  }

  reset(taskId: string): void {
    const streak = this.findByTaskId(taskId);
    if (streak) {
      this.db.prepare('UPDATE habit_streaks SET current_streak = 0, streak_start = NULL WHERE task_id = ?').run(taskId);
    }
  }

  delete(taskId: string): void {
    this.db.prepare('DELETE FROM habit_streaks WHERE task_id = ?').run(taskId);
  }
}

let habitStreakRepository: HabitStreakRepository | null = null;

export function getHabitStreakRepository(): HabitStreakRepository {
  if (!habitStreakRepository) {
    habitStreakRepository = new HabitStreakRepository();
  }
  return habitStreakRepository;
}
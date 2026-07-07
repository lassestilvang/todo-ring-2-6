import { BaseRepository } from './base-repository';
import type { HabitStreak } from '../../src/types/index';

export class HabitStreakRepository extends BaseRepository<HabitStreak> {
  constructor() {
    super('habit_streaks');
  }

  getByTaskId(taskId: string): HabitStreak | undefined {
    return this.db.prepare(
      'SELECT * FROM habit_streaks WHERE task_id = ?'
    ).get(taskId) as HabitStreak | undefined;
  }

  updateOnComplete(taskId: string): HabitStreak | undefined {
    const streak = this.getByTaskId(taskId);
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (!streak) {
      const id = crypto.randomUUID();
      this.db.prepare(
        'INSERT INTO habit_streaks (id, task_id, current_streak, longest_streak, last_completed, created_at, updated_at) VALUES (?, ?, 1, 1, ?, ?, ?)'
      ).run(id, taskId, today, now, now);
      return this.getByTaskId(taskId);
    }

    const newStreak = streak.lastCompleted === today ? streak.currentStreak : streak.currentStreak + 1;
    const longestStreak = Math.max(newStreak, streak.longestStreak);

    this.db.prepare(
      'UPDATE habit_streaks SET current_streak = ?, longest_streak = ?, last_completed = ?, updated_at = ? WHERE id = ?'
    ).run(newStreak, longestStreak, today, now, streak.id);

    return this.getByTaskId(taskId);
  }
}

export function getHabitStreakRepository(): HabitStreakRepository {
  return new HabitStreakRepository();
}

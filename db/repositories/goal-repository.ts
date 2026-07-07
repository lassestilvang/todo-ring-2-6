import { BaseRepository } from './base-repository';
import type { Goal } from '../../src/types/index';

export class GoalRepository extends BaseRepository<Goal> {
  constructor() {
    super('goals', { timestamps: true });
  }

  getByUserId(userId: string): Goal[] {
    return this.db.prepare(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY start_date DESC'
    ).all(userId) as Goal[];
  }

  getByPeriod(userId: string, period: string): Goal[] {
    return this.db.prepare(
      'SELECT * FROM goals WHERE user_id = ? AND period = ? ORDER BY start_date DESC'
    ).all(userId, period) as Goal[];
  }

  updateProgress(id: string, progress: number): Goal {
    this.db.prepare(
      'UPDATE goals SET current_value = ?, updated_at = ?, updated_at = ? WHERE id = ?'
    ).run(progress, new Date().toISOString(), id);
    return this.findById(id)!;
  }

  getActiveGoals(userId: string, period: string): Goal[] {
    return this.db.prepare(
      'SELECT * FROM goals WHERE user_id = ? AND period = ? AND is_completed = 0 ORDER BY start_date DESC'
    ).all(userId, period) as Goal[];
  }

  getProgress(id: string): { current: number; target: number; percentage: number } {
    const goal = this.findById(id);
    if (!goal) return { current: 0, target: 0, percentage: 0 };
    return {
      current: goal.currentValue || 0,
      target: goal.targetValue || 0,
      percentage: goal.targetValue ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
    };
  }
}

export function getGoalRepository(): GoalRepository {
  return new GoalRepository();
}

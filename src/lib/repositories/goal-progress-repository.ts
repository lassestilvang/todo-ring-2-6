/**
 * Goal Progress Repository
 * Provides CRUD operations for goal progress tracking
 */

import { BaseRepository } from './base-repository';
import type { GoalProgress } from '@/types/index';

export class GoalProgressRepository extends BaseRepository<GoalProgress> {
  constructor() {
    super('goal_progress', { timestamps: true });
  }

  /**
   * Find all progress entries for a goal
   */
  findByGoalId(goalId: string): GoalProgress[] {
    return this.query('SELECT * FROM goal_progress WHERE goal_id = ? ORDER BY recorded_at DESC', [goalId]);
  }

  /**
   * Get the latest progress entry for a goal
   */
  findLatestByGoalId(goalId: string): GoalProgress | undefined {
    return this.queryOne(
      'SELECT * FROM goal_progress WHERE goal_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [goalId]
    );
  }

  /**
   * Create a new progress entry
   */
  create(data: Omit<GoalProgress, 'id' | 'createdAt' | 'updatedAt'> & Record<string, any>): GoalProgress {
    return super.create(data);
  }

  /**
   * Delete all progress for a goal
   */
  deleteByGoalId(goalId: string): boolean {
    this.db.prepare('DELETE FROM goal_progress WHERE goal_id = ?').run(goalId);
    return true;
  }
}

let goalProgressRepository: GoalProgressRepository | null = null;

export function getGoalProgressRepository(): GoalProgressRepository {
  if (!goalProgressRepository) {
    goalProgressRepository = new GoalProgressRepository();
  }
  return goalProgressRepository;
}
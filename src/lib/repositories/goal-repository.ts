/**
 * Goal Repository
 * Handles all database operations related to goals
 */

import { getDb } from '../../db/index';
import type { Goal } from '@/types/index';

export class GoalRepository {
  private db = getDb();

  findAll(): Goal[] {
    return this.db.prepare(
      'SELECT * FROM goals ORDER BY created_at DESC'
    ).all() as Goal[];
  }

  findById(id: string): Goal | undefined {
    return this.db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal | undefined;
  }

  findByUserId(userId: string): Goal[] {
    return this.db.prepare(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as Goal[];
  }

  findByPeriod(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Goal[] {
    return this.db.prepare(
      'SELECT * FROM goals WHERE period = ? ORDER BY created_at DESC'
    ).all(period) as Goal[];
  }

  create(data: {
    userId: string;
    title: string;
    description?: string;
    targetValue: number;
    unit?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    category?: string;
    color?: string;
    startDate: string;
    endDate: string;
  }): Goal {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO goals (id, user_id, title, description, target_value, unit, period, category, color, current_value, is_completed, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`
    ).run(
      id,
      data.userId,
      data.title,
      data.description || '',
      data.targetValue,
      data.unit || 'tasks',
      data.period || 'weekly',
      data.category || 'general',
      data.color || '#3b82f6',
      data.startDate,
      data.endDate,
      now,
      now
    );

    return this.findById(id)!;
  }

  update(id: string, data: Partial<Omit<Goal, 'id'>>): Goal {
    const now = new Date().toISOString();
    const goal = this.findById(id);
    if (!goal) throw new Error('Goal not found');

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.targetValue !== undefined) { updates.push('target_value = ?'); values.push(data.targetValue); }
    if (data.unit !== undefined) { updates.push('unit = ?'); values.push(data.unit); }
    if (data.period !== undefined) { updates.push('period = ?'); values.push(data.period); }
    if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.startDate !== undefined) { updates.push('start_date = ?'); values.push(data.startDate); }
    if (data.endDate !== undefined) { updates.push('end_date = ?'); values.push(data.endDate); }
    if (data.isCompleted !== undefined) { updates.push('is_completed = ?'); values.push(data.isCompleted ? 1 : 0); }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  updateProgress(id: string, increment: number): Goal {
    const goal = this.findById(id);
    if (!goal) throw new Error('Goal not found');

    const newValue = Math.min(Math.max(goal.currentValue + increment, 0), goal.targetValue);
    const isCompleted = newValue >= goal.targetValue;
    const now = new Date().toISOString();

    this.db.prepare(
      'UPDATE goals SET current_value = ?, is_completed = ?, updated_at = ? WHERE id = ?'
    ).run(newValue, isCompleted ? 1 : 0, now, id);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  }

  getProgress(id: string): { current: number; target: number; percentage: number; isCompleted: boolean } {
    const goal = this.findById(id);
    if (!goal) throw new Error('Goal not found');

    const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    return {
      current: goal.currentValue,
      target: goal.targetValue,
      percentage,
      isCompleted: Boolean(goal.isCompleted),
    };
  }

  getActiveByPeriod(period: 'daily' | 'weekly' | 'monthly' | 'yearly', userId?: string): Goal[] {
    const now = new Date().toISOString().split('T')[0];
    if (!now) return [];

    let query = 'SELECT * FROM goals WHERE period = ? AND start_date <= ? AND end_date >= ?';
    const values: (string | number)[] = [period, now, now];

    if (userId) {
      query += ' AND user_id = ?';
      values.push(userId);
    }

    query += ' ORDER BY created_at DESC';
    return this.db.prepare(query).all(...values) as Goal[];
  }
}

let goalRepository: GoalRepository | null = null;

export function getGoalRepository(): GoalRepository {
  if (!goalRepository) {
    goalRepository = new GoalRepository();
  }
  return goalRepository;
}
/**
 * Enhanced Task Repository
 * Refactored to use the BaseRepository pattern
 */

import { BaseRepository, QueryBuilder } from './base-repository';
import type { Task } from '../../types/index';

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super('tasks', { timestamps: true });
  }

  /**
   * Find tasks by list ID with optional date filter
   */
  findByList(listId: string, date?: string): Task[] {
    let query = `SELECT * FROM tasks WHERE list_id = ?`;
    const values = [listId];

    if (date) {
      query += ' AND date = ?';
      values.push(date);
    }

    query += ' ORDER BY sort_order ASC';
    return this.db.prepare(query).all(...values) as Task[];
  }

  /**
   * Get tasks for a specific date
   */
  getByDate(date: string): Task[] {
    return this.db.prepare(
      'SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC'
    ).all(date) as Task[];
  }

  /**
   * Get inbox tasks
   */
  getInboxTasks(): Task[] {
    return this.db.prepare(`
      SELECT t.* FROM tasks t
      JOIN lists l ON t.list_id = l.id
      WHERE l.is_inbox = 1
      ORDER BY t.sort_order ASC, t.created_at DESC
    `).all() as Task[];
  }

  /**
   * Get tasks for today
   */
  getTasksForToday(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.db.prepare(
      'SELECT * FROM tasks WHERE date = ? AND status != ? ORDER BY sort_order ASC'
    ).all(today, 'completed') as Task[];
  }

  /**
   * Get tasks for next 7 days
   */
  getTasksForNext7Days(): Task[] {
    const today = new Date();
    const next7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.db.prepare(
      'SELECT * FROM tasks WHERE date >= ? AND date <= ? AND status != ? ORDER BY date ASC, sort_order ASC'
    ).all(today.toISOString().split('T')[0], next7.toISOString().split('T')[0], 'completed') as Task[];
  }

  /**
   * Get upcoming tasks
   */
  getUpcomingTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.db.prepare(
      'SELECT * FROM tasks WHERE date >= ? AND status != ? ORDER BY date ASC, sort_order ASC'
    ).all(today, 'completed') as Task[];
  }

  /**
   * Search tasks by title or description
   */
  search(query: string): Task[] {
    const searchPattern = `%${query}%`;
    return this.db.prepare(
      'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY sort_order ASC'
    ).all(searchPattern, searchPattern) as Task[];
  }

  /**
   * Toggle task status
   */
  toggleStatus(id: string): Task {
    const task = this.findById(id);
    if (!task) throw new Error('Task not found');

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const now = new Date().toISOString();

    this.db.prepare(
      'UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?'
    ).run(newStatus, newStatus === 'completed' ? now : null, now, id);

    return this.findById(id)!;
  }

  /**
   * Update sort order
   */
  updateSortOrder(id: string, newPosition: number): void {
    this.db.prepare('UPDATE tasks SET sort_order = ?, updated_at = ? WHERE id = ?').run(
      newPosition,
      new Date().toISOString(),
      id
    );
  }

  /**
   * Get paginated tasks
   */
  getPagination(options: {
    limit: number;
    cursor?: string;
    listId?: string;
    status?: string;
  }): { tasks: Task[]; nextCursor: string | null } {
    const { limit, cursor, listId, status } = options;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const values: any[] = [];

    if (listId) {
      query += ' AND list_id = ?';
      values.push(listId);
    }

    if (status) {
      query += ' AND status = ?';
      values.push(status);
    }

    if (cursor) {
      const cursorTask = this.findById(cursor);
      if (cursorTask) {
        query += ' AND (sort_order > ? OR (sort_order = ? AND created_at > ?))';
        values.push(cursorTask.sortOrder, cursorTask.sortOrder, cursorTask.createdAt);
      }
    }

    query += ' ORDER BY sort_order ASC, created_at DESC LIMIT ?';
    values.push(limit + 1);

    const results = this.db.prepare(query).all(...values) as Task[];
    const hasMore = results.length > limit;
    const tasks = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? tasks[tasks.length - 1].id : null;

    return { tasks, nextCursor };
  }

  /**
   * Get tasks with filters
   */
  getFilteredTasks(filters: {
    priorities?: ('high' | 'medium' | 'low' | 'none')[];
    statuses?: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
    labelFilterIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    minEstimate?: number;
    maxEstimate?: number;
  }): Task[] {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const values: any[] = [];

    if (filters.priorities?.length) {
      query += ` AND priority IN (${filters.priorities.map(() => '?').join(',')})`;
      values.push(...filters.priorities);
    }

    if (filters.statuses?.length) {
      query += ` AND status IN (${filters.statuses.map(() => '?').join(',')})`;
      values.push(...filters.statuses);
    }

    if (filters.labelFilterIds?.length) {
      query += ` AND id IN (SELECT task_id FROM task_labels WHERE label_id IN (${filters.labelFilterIds.map(() => '?').join(',')}))`;
      values.push(...filters.labelFilterIds);
    }

    if (filters.dateFrom) {
      query += ' AND date >= ?';
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND date <= ?';
      values.push(filters.dateTo);
    }

    if (filters.minEstimate !== undefined || filters.maxEstimate !== undefined) {
      const totalMinutes = '(estimate_hours * 60 + estimate_minutes)';
      if (filters.minEstimate !== undefined) {
        query += ` AND CAST(${totalMinutes} AS REAL) >= ?`;
        values.push(filters.minEstimate);
      }
      if (filters.maxEstimate !== undefined) {
        query += ` AND CAST(${totalMinutes} AS REAL) <= ?`;
        values.push(filters.maxEstimate);
      }
    }

    return this.db.prepare(query).all(...values) as Task[];
  }
}
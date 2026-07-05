/**
 * Task Repository
 * Handles all database operations related to tasks
 */

import { getDb } from '../../db/index';
import type { Task } from '@/types/index';

export class TaskRepository {
  private db = getDb();

  findAll(options?: { listId?: string; date?: string }): Task[] {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const values: (string | number)[] = [];

    if (options?.listId) {
      query += ' AND list_id = ?';
      values.push(options.listId);
    }

    if (options?.date) {
      query += ' AND date = ?';
      values.push(options.date);
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    return this.db.prepare(query).all(...values) as Task[];
  }

  findById(id: string): Task | undefined {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  }

  findByList(listId: string, date?: string): Task[] {
    let query = 'SELECT * FROM tasks WHERE list_id = ?';
    const values = [listId];

    if (date) {
      query += ' AND date = ?';
      values.push(date);
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    return this.db.prepare(query).all(...values) as Task[];
  }

  create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO tasks (id, title, description, list_id, date, deadline, reminder_time,
       estimate_hours, estimate_minutes, actual_hours, actual_minutes, priority, status,
       recurring_type, recurring_interval, is_all_day, is_habit, completed_at, sort_order,
       created_at, updated_at, assignee_id, assignee_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.title,
      data.description || '',
      data.listId || null,
      data.date || null,
      data.deadline || null,
      data.reminderTime || null,
      data.estimateHours || 0,
      data.estimateMinutes || 0,
      data.actualHours || 0,
      data.actualMinutes || 0,
      data.priority || 'none',
      data.status || 'pending',
      data.recurringType || 'none',
      data.recurringInterval || '',
      data.isAllDay ? 1 : 0,
      data.isHabit ? 1 : 0,
      data.completedAt || null,
      data.sortOrder || 0,
      now,
      now,
      data.assigneeId || null,
      data.assigneeName || null
    );

    return this.findById(id)!;
  }

  update(id: string, data: Partial<Omit<Task, 'id'>>): Task {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | number | null | boolean)[] = [];

    const fields = [
      'title', 'description', 'listId', 'date', 'deadline', 'reminderTime',
      'estimateHours', 'estimateMinutes', 'actualHours', 'actualMinutes',
      'priority', 'status', 'recurringType', 'recurringInterval',
      'isAllDay', 'isHabit', 'completedAt', 'sortOrder',
      'assigneeId', 'assigneeName'
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        const dbField = this.camelToSnake(field);
        updates.push(`${dbField} = ?`);
        values.push(data[field] as string | number | null | boolean);
      }
    }

    updates.push(`updated_at = ?`);
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  updateSortOrder(id: string, newPosition: number): void {
    this.db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?').run(newPosition, id);
  }

  getTasksForToday(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.db.prepare(
      'SELECT * FROM tasks WHERE date = ? AND status != ? ORDER BY sort_order ASC'
    ).all(today, 'completed') as Task[];
  }

  getTasksForNext7Days(): Task[] {
    const today = new Date();
    const next7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.db.prepare(
      'SELECT * FROM tasks WHERE date >= ? AND date <= ? AND status != ? ORDER BY date ASC, sort_order ASC'
    ).all(today.toISOString().split('T')[0], next7.toISOString().split('T')[0], 'completed') as Task[];
  }

  getUpcomingTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.db.prepare(
      'SELECT * FROM tasks WHERE date >= ? AND status != ? ORDER BY date ASC, sort_order ASC'
    ).all(today, 'completed') as Task[];
  }

  getByDate(date: string): Task[] {
    return this.db.prepare(
      'SELECT * FROM tasks WHERE date = ? ORDER BY sort_order ASC, created_at DESC'
    ).all(date) as Task[];
  }

  getAllTasks(): Task[] {
    return this.db.prepare(
      'SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC'
    ).all() as Task[];
  }

  getInboxTasks(): Task[] {
    return this.db.prepare(
      `SELECT t.* FROM tasks t
       JOIN lists l ON t.list_id = l.id
       WHERE l.is_inbox = 1
       ORDER BY t.sort_order ASC, t.created_at DESC`
    ).all() as Task[];
  }

  search(query: string): Task[] {
    return this.db.prepare(
      'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY sort_order ASC'
    ).all(`%${query}%`, `%${query}%`) as Task[];
  }

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

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Clone a task with optional modifications
   */
  clone(taskId: string, options: {
    resetStatus?: boolean;
    resetDate?: boolean;
    newDate?: string;
    duplicateSubtasks?: boolean;
    newListId?: string;
    titlePrefix?: string;
  } = {}): Task | null {
    const original = this.findById(taskId);
    if (!original) return null;

    const now = new Date().toISOString();
    const newId = crypto.randomUUID();

    this.db.prepare(`
      INSERT INTO tasks (id, title, description, list_id, date, deadline, reminder_time,
       estimate_hours, estimate_minutes, actual_hours, actual_minutes, priority, status,
       recurring_type, recurring_interval, is_all_day, is_habit, completed_at, sort_order,
       created_at, updated_at, assignee_id, assignee_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      options.titlePrefix
        ? `${options.titlePrefix} ${original.title}`
        : original.title,
      original.description || '',
      options.newListId || original.listId,
      options.resetDate ? (options.newDate || null) : original.date,
      original.deadline,
      original.reminderTime,
      original.estimateHours,
      original.estimateMinutes,
      0, 0, // Reset actual time
      original.priority,
      options.resetStatus ? 'pending' : original.status,
      original.recurringType,
      original.recurringInterval,
      original.isAllDay ? 1 : 0,
      original.isHabit ? 1 : 0,
      null, // Reset completed_at
      original.sortOrder,
      now, now,
      original.assigneeId,
      original.assigneeName
    );

    // Duplicate labels if they exist
    if (original.labels && original.labels.length > 0) {
      const labelStmt = this.db.prepare(
        'INSERT OR IGNORE INTO task_labels (id, task_id, label_id) VALUES (?, ?, ?)'
      );
      for (const labelId of original.labels) {
        labelStmt.run(crypto.randomUUID(), newId, labelId);
      }
    }

    return this.findById(newId)!;
  }

  /**
   * Bulk update multiple tasks
   */
  bulkUpdate(ids: string[], data: Partial<Omit<Task, 'id'>>): number {
    if (ids.length === 0) return 0;

    const updates: string[] = [];
    const values: any[] = [];

    const fields = [
      'title', 'description', 'listId', 'date', 'deadline', 'reminderTime',
      'estimateHours', 'estimateMinutes', 'actualHours', 'actualMinutes',
      'priority', 'status', 'recurringType', 'recurringInterval',
      'isAllDay', 'isHabit', 'completedAt', 'sortOrder',
      'assigneeId', 'assigneeName'
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        const dbField = this.camelToSnake(field);
        updates.push(`${dbField} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return 0;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    const placeholders = ids.map(() => '?').join(',');
    values.push(...ids);

    const stmt = this.db.prepare(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id IN (${placeholders})`
    );
    stmt.run(...values);

    return ids.length;
  }

  /**
   * Bulk delete multiple tasks
   */
  bulkDelete(ids: string[]): number {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`DELETE FROM tasks WHERE id IN (${placeholders})`).run(...ids);

    return ids.length;
  }
}

// Singleton instance
let taskRepository: TaskRepository | null = null;

export function getTaskRepository(): TaskRepository {
  if (!taskRepository) {
    taskRepository = new TaskRepository();
  }
  return taskRepository;
}
/**
 * Task Repository
 * Handles all database operations related to tasks
 */

import { getDb } from '@/db/index';
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

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
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
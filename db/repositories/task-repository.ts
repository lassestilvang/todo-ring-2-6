import { BaseRepository } from './base-repository';
import type { Task, Label } from '../../src/types/index';
import { ListRepository } from './list-repository';

/**
 * Task repository for database operations related to tasks
 */
export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super('tasks');
  }

  /**
   * Get tasks by list ID
   */
  getByListId(listId: string): Task[] {
    const tasks = this.db.prepare(
      'SELECT * FROM tasks WHERE list_id = ? ORDER BY sort_order ASC, created_at DESC'
    ).all(listId) as Task[];
    return this.attachLabels(tasks);
  }

  /**
   * Get tasks by date
   */
  getByDate(date: string): Task[] {
    const tasks = this.db.prepare(
      "SELECT * FROM tasks WHERE date = ? AND status NOT IN ('completed', 'cancelled') ORDER BY sort_order ASC"
    ).all(date) as Task[];
    return this.attachLabels(tasks);
  }

  /**
   * Get tasks for next 7 days
   */
  getNext7Days(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tasks = this.db.prepare(
      "SELECT * FROM tasks WHERE date BETWEEN ? AND ? AND status NOT IN ('completed', 'cancelled') ORDER BY date ASC, sort_order ASC"
    ).all(today, endDate) as Task[];
    return this.attachLabels(tasks);
  }

  /**
   * Get inbox tasks
   */
  getInboxTasks(): Task[] {
    const listRepo = new ListRepository();
    const inbox = listRepo.getInbox();
    return this.getByListId(inbox.id);
  }

  /**
   * Get tasks for today
   */
  getTodaysTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    const tasks = this.db.prepare(
      "SELECT * FROM tasks WHERE date = ? AND status != 'completed' AND status != 'cancelled' ORDER BY sort_order ASC"
    ).all(today) as Task[];
    return this.attachLabels(tasks);
  }

  /**
   * Create a new task
   */
  create(data: {
    title: string;
    description?: string;
    listId?: string | null;
    date?: string | null;
    deadline?: string | null;
    estimateHours?: number;
    estimateMinutes?: number;
    priority?: string;
    recurringType?: string;
    recurringInterval?: string;
    isAllDay?: boolean;
    isHabit?: boolean;
  }): Task {
    const id = this.generateId();
    const now = this.now();
    const listRepo = new ListRepository();
    const inbox = listRepo.getInbox();
    const listId = data.listId ?? inbox.id;

    this.db.prepare(`
      INSERT INTO tasks
      (id, title, description, list_id, date, deadline, estimate_hours, estimate_minutes,
       actual_hours, actual_minutes, priority, status, recurring_type, recurring_interval,
       is_all_day, is_habit, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?, ?,
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks), ?, ?)
    `).run(
      id, data.title, data.description || '', listId, data.date || null,
      data.deadline || null, data.estimateHours || 0, data.estimateMinutes || 0,
      data.priority || 'none', data.recurringType || 'none',
      data.recurringInterval || '', data.isAllDay ? 1 : 0, data.isHabit ? 1 : 0, now, now
    );

    return this.findById(id)!;
  }

  /**
   * Update a task
   */
  update(id: string, data: Partial<{
    title: string;
    description: string;
    listId: string | null;
    date: string | null;
    deadline: string | null;
    estimateHours: number;
    estimateMinutes: number;
    actualHours: number;
    actualMinutes: number;
    priority: string;
    status: string;
    recurringType: string;
    recurringInterval: string;
    isAllDay: boolean;
    isHabit: boolean;
  }>): Task {
    const existing = this.findById(id);
    if (!existing) throw new Error('Task not found');

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    const fieldMap: Record<string, { col: string; val: any }> = {
      title: { col: 'title', val: data.title },
      description: { col: 'description', val: data.description },
      listId: { col: 'list_id', val: data.listId },
      date: { col: 'date', val: data.date },
      deadline: { col: 'deadline', val: data.deadline },
      estimateHours: { col: 'estimate_hours', val: data.estimateHours },
      estimateMinutes: { col: 'estimate_minutes', val: data.estimateMinutes },
      actualHours: { col: 'actual_hours', val: data.actualHours },
      actualMinutes: { col: 'actual_minutes', val: data.actualMinutes },
      priority: { col: 'priority', val: data.priority },
      status: { col: 'status', val: data.status },
      recurringType: { col: 'recurring_type', val: data.recurringType },
      recurringInterval: { col: 'recurring_interval', val: data.recurringInterval },
      isAllDay: { col: 'is_all_day', val: data.isAllDay ? 1 : 0 },
      isHabit: { col: 'is_habit', val: data.isHabit ? 1 : 0 },
    };

    for (const [key, { col, val }] of Object.entries(fieldMap)) {
      if (data[key as keyof typeof data] !== undefined) {
        updates.push(`${col} = ?`);
        values.push(val);
      }
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(this.now());
    values.push(id);

    this.db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  /**
   * Toggle task status
   */
  toggleStatus(id: string): Task {
    const task = this.findById(id);
    if (!task) throw new Error('Task not found');

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const now = this.now();

    this.db.prepare('UPDATE tasks SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?')
      .run(newStatus, now, newStatus === 'completed' ? now : null, id);

    return this.findById(id)!;
  }

  /**
   * Update task sort order
   */
  updateSortOrder(taskId: string, newPosition: number): Task {
    const task = this.findById(taskId);
    if (!task) throw new Error('Task not found');

    const oldPosition = task.sortOrder;

    if (newPosition > oldPosition) {
      this.db.prepare(
        'UPDATE tasks SET sort_order = sort_order - 1 WHERE sort_order > ? AND sort_order <= ?'
      ).run(oldPosition, newPosition);
    } else if (newPosition < oldPosition) {
      this.db.prepare(
        'UPDATE tasks SET sort_order = sort_order + 1 WHERE sort_order >= ? AND sort_order < ?'
      ).run(newPosition, oldPosition);
    }

    this.db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?').run(newPosition, taskId);
    return this.findById(taskId)!;
  }

  /**
   * Search tasks using FTS5
   */
  search(query: string): Task[] {
    const searchPattern = `%${query}%`;

    const ftsResults = this.db.prepare(
      `SELECT t.* FROM tasks t
       JOIN tasks_fts fts ON t.rowid = fts.rowid
       WHERE tasks_fts MATCH ?
       ORDER BY rank`
    ).all(query);

    if (ftsResults && (ftsResults as any[]).length > 0) {
      return (ftsResults as any[]).map((r: any) => {
        delete r.rowid;
        return r as Task;
      });
    }

    return this.db.prepare(
      'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC'
    ).all(searchPattern, searchPattern) as Task[];
  }

  /**
   * Get tasks with pagination
   */
  getPagination(options: {
    limit: number;
    cursor?: string;
    listId?: string;
    status?: string;
  }): { tasks: Task[]; nextCursor: string | null } {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    let countQuery = 'SELECT COUNT(*) as count FROM tasks WHERE 1=1';
    const countParams: any[] = [];

    if (options.listId) {
      query += ' AND list_id = ?';
      countQuery += ' AND list_id = ?';
      params.push(options.listId);
      countParams.push(options.listId);
    }

    if (options.status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(options.status);
      countParams.push(options.status);
    }

    if (options.cursor) {
      query += ' AND sort_order < (SELECT sort_order FROM tasks WHERE id = ?)';
      params.push(options.cursor);
    }

    query += ' ORDER BY sort_order DESC, created_at DESC LIMIT ?';
    params.push(options.limit + 1);

    const tasks = this.db.prepare(query).all(...params) as Task[];
    const hasMore = tasks.length > options.limit;
    const nextCursor = hasMore ? tasks[tasks.length - 1].id : null;

    return {
      tasks: hasMore ? tasks.slice(0, options.limit) : tasks,
      nextCursor,
    };
  }

  /**
   * Attach labels to tasks
   */
  private attachLabels(tasks: Task[]): Task[] {
    if (tasks.length === 0) return tasks;

    const taskIds = tasks.map(t => t.id);
    const placeholders = taskIds.map(() => '?').join(',');

    const labelRows = this.db.prepare(
      `SELECT task_id, label_id FROM task_labels WHERE task_id IN (${placeholders})`
    ).all(...taskIds) as { task_id: string; label_id: string }[];

    const labelMap = new Map<string, string[]>();
    for (const row of labelRows) {
      if (!labelMap.has(row.task_id)) {
        labelMap.set(row.task_id, []);
      }
      labelMap.get(row.task_id)!.push(row.label_id);
    }

    return tasks.map(task => ({
      ...task,
      labels: labelMap.get(task.id) || [],
    }));
  }
}
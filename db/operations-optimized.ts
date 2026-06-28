/**
 * Optimized Database Operations
 * Contains optimized versions of common operations with eager loading
 */

import { getDb } from './db-client';
import type { Task, Label, Subtask } from '../src/types/index';

// === Optimized Task Operations ===

/**
 * Get tasks with all related data (labels, subtasks) in a single query
 * This avoids N+1 query problems when displaying task lists
 */
export function getTasksWithRelations(listId?: string, status?: string): Task[] {
  const db = getDb();
  let query = `
    SELECT
      t.*,
      COALESCE(
        (SELECT json_group_array(
          json_object(
            'id', l.id,
            'name', l.name,
            'color', l.color,
            'icon', l.icon
          )
        ) FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id),
        '[]'
      ) as labels_json
    FROM tasks t
    WHERE 1=1
  `;

  const values: (string | number)[] = [];

  if (listId) {
    query += ' AND t.list_id = ?';
    values.push(listId);
  }

  if (status) {
    query += ' AND t.status = ?';
    values.push(status);
  }

  query += ' ORDER BY t.sort_order ASC, t.created_at DESC';

  const tasks = db.prepare(query).all(...values) as any[];

  // Parse labels JSON and attach to tasks
  return tasks.map(task => ({
    ...task,
    labels: task.labels_json ? JSON.parse(task.labels_json) : [],
  })) as Task[];
}

/**
 * Get a single task with all related data
 */
export function getTaskWithRelations(id: string): Task | undefined {
  const db = getDb();

  const task = db.prepare(`
    SELECT
      t.*,
      COALESCE(
        (SELECT json_group_array(
          json_object(
            'id', l.id,
            'name', l.name,
            'color', l.color,
            'icon', l.icon
          )
        ) FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id),
        '[]'
      ) as labels_json
    FROM tasks t
    WHERE t.id = ?
  `).get(id) as any | undefined;

  if (!task) return undefined;

  return {
    ...task,
    labels: task.labels_json ? JSON.parse(task.labels_json) : [],
  } as Task;
}

/**
 * Get tasks for a specific view with optimized querying
 */
export function getTasksForView(
  view: 'today' | 'next7' | 'upcoming' | 'all',
  filters?: {
    listId?: string;
    status?: string;
    priorities?: string[];
  }
): Task[] {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT
      t.*,
      COALESCE(
        (SELECT json_group_array(
          json_object(
            'id', l.id,
            'name', l.name,
            'color', l.color,
            'icon', l.icon
          )
        ) FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id),
        '[]'
      ) as labels_json
    FROM tasks t
    WHERE t.status NOT IN ('completed', 'cancelled')
  `;

  const values: (string | number)[] = [];

  // Apply date filters based on view
  if (view === 'today') {
    query += ' AND date = ?';
    values.push(today);
  } else if (view === 'next7') {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    query += ' AND date BETWEEN ? AND ?';
    values.push(today, nextWeek);
  } else if (view === 'upcoming') {
    query += ' AND date >= ?';
    values.push(today);
  }

  // Apply filters
  if (filters?.listId) {
    query += ' AND t.list_id = ?';
    values.push(filters.listId);
  }

  if (filters?.status) {
    query += ' AND t.status = ?';
    values.push(filters.status);
  }

  if (filters?.priorities && filters.priorities.length > 0) {
    const placeholders = filters.priorities.map(() => '?').join(',');
    query += ` AND t.priority IN (${placeholders})`;
    values.push(...filters.priorities);
  }

  query += ' ORDER BY t.date ASC, t.priority DESC, t.created_at DESC';

  const tasks = db.prepare(query).all(...values) as any[];

  return tasks.map(task => ({
    ...task,
    labels: task.labels_json ? JSON.parse(task.labels_json) : [],
  })) as Task[];
}

/**
 * Get tasks with subtasks for a list of task IDs (batch operation)
 */
export function getTasksWithSubtasks(taskIds: string[]): Task[] {
  if (taskIds.length === 0) return [];

  const db = getDb();
  const placeholders = taskIds.map(() => '?').join(',');

  const tasks = db.prepare(`
    SELECT
      t.*,
      COALESCE(
        (SELECT json_group_array(
          json_object(
            'id', l.id,
            'name', l.name,
            'color', l.color,
            'icon', l.icon
          )
        ) FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id),
        '[]'
      ) as labels_json,
      COALESCE(
        (SELECT json_group_array(
          json_object(
            'id', s.id,
            'taskId', s.task_id,
            'title', s.title,
            'isCompleted', s.is_completed,
            'sortOrder', s.sort_order,
            'createdAt', s.created_at
          )
        ) FROM subtasks s WHERE s.task_id = t.id),
        '[]'
      ) as subtasks_json
    FROM tasks t
    WHERE t.id IN (${placeholders})
  `).all(...taskIds) as any[];

  return tasks.map(task => ({
    ...task,
    labels: task.labels_json ? JSON.parse(task.labels_json) : [],
    subtasks: task.subtasks_json ? JSON.parse(task.subtasks_json) : [],
  })) as Task[];
}

// === Database Statistics ===

export function getDatabaseStats() {
  const db = getDb();
  return {
    tasks: db.prepare('SELECT COUNT(*) as count FROM tasks').get()?.count || 0,
    completed: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get()?.count || 0,
    lists: db.prepare('SELECT COUNT(*) as count FROM lists').get()?.count || 0,
    labels: db.prepare('SELECT COUNT(*) as count FROM labels').get()?.count || 0,
  };
}
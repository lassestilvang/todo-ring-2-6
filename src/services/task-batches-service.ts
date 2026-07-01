/**
 * Task Batches Service
 * Manages groups of tasks (projects/orders) with bulk operations
 */

import { getDb } from '@/lib/db-client';
import type { Task } from '@/types/index';

export interface TaskBatch {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BatchStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalEstimateHours: number;
  totalActualHours: number;
}

/**
 * Get all batches for a user
 */
export function getBatches(userId: string): TaskBatch[] {
  const db = getDb();

  const batches = db
    .prepare(`
      SELECT b.*, GROUP_CONCAT(bt.task_id) as task_ids
      FROM task_batches b
      LEFT JOIN batch_tasks bt ON b.id = bt.batch_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `)
    .all(userId) as (TaskBatch & { task_ids: string | null })[];

  return batches.map(b => ({
    ...b,
    taskIds: b.task_ids ? b.task_ids.split(',') : []
  }));
}

/**
 * Get a single batch with tasks
 */
export function getBatch(id: string, userId: string): TaskBatch | undefined {
  const db = getDb();

  const batch = db
    .prepare(`
      SELECT b.*, GROUP_CONCAT(bt.task_id) as task_ids
      FROM task_batches b
      LEFT JOIN batch_tasks bt ON b.id = bt.batch_id
      WHERE b.id = ? AND b.user_id = ?
      GROUP BY b.id
    `)
    .get(id, userId) as (TaskBatch & { task_ids: string | null }) | undefined;

  if (!batch) return undefined;

  return {
    ...batch,
    taskIds: batch.task_ids ? batch.task_ids.split(',') : []
  };
}

/**
 * Create a new batch
 */
export function createBatch(userId: string, data: {
  name: string;
  description?: string;
  color?: string;
  taskIds?: string[];
}): TaskBatch {
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO task_batches (id, user_id, name, description, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, data.name, data.description || '', data.color || '#3b82f6');

  // Add tasks to batch
  if (data.taskIds && data.taskIds.length > 0) {
    const stmt = db.prepare('INSERT INTO batch_tasks (id, batch_id, task_id) VALUES (?, ?, ?)');
    for (const taskId of data.taskIds) {
      stmt.run(crypto.randomUUID(), id, taskId);
    }
  }

  return getBatch(id, userId)!;
}

/**
 * Update a batch
 */
export function updateBatch(id: string, userId: string, data: Partial<{
  name: string;
  description: string;
  color: string;
  taskIds: string[];
}>): TaskBatch | undefined {
  const db = getDb();
  const existing = getBatch(id, userId);
  if (!existing) return undefined;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }

  if (updates.length > 0) {
    values.push(id, userId);
    db.prepare(`UPDATE task_batches SET ${updates.join(', ')}, updated_at = (datetime('now')) WHERE id = ? AND user_id = ?`)
      .run(...values);
  }

  // Update task associations
  if (data.taskIds !== undefined) {
    db.prepare('DELETE FROM batch_tasks WHERE batch_id = ?').run(id);
    if (data.taskIds.length > 0) {
      const stmt = db.prepare('INSERT INTO batch_tasks (id, batch_id, task_id) VALUES (?, ?, ?)');
      for (const taskId of data.taskIds) {
        stmt.run(crypto.randomUUID(), id, taskId);
      }
    }
  }

  return getBatch(id, userId);
}

/**
 * Delete a batch
 */
export function deleteBatch(id: string, userId: string): boolean {
  const db = getDb();

  db.prepare('DELETE FROM batch_tasks WHERE batch_id = ?').run(id);
  const result = db.prepare('DELETE FROM task_batches WHERE id = ? AND user_id = ?').run(id, userId);

  return result.changes > 0;
}

/**
 * Add tasks to a batch
 */
export function addTasksToBatch(id: string, userId: string, taskIds: string[]): TaskBatch | undefined {
  const db = getDb();

  // Verify batch ownership
  const batch = db.prepare('SELECT id FROM task_batches WHERE id = ? AND user_id = ?').get(id, userId);
  if (!batch) return undefined;

  const stmt = db.prepare('INSERT OR IGNORE INTO batch_tasks (id, batch_id, task_id) VALUES (?, ?, ?)');
  for (const taskId of taskIds) {
    stmt.run(crypto.randomUUID(), id, taskId);
  }

  return getBatch(id, userId);
}

/**
 * Remove tasks from a batch
 */
export function removeTasksFromBatch(id: string, userId: string, taskIds: string[]): TaskBatch | undefined {
  const db = getDb();

  const placeholders = taskIds.map(() => '?').join(',');
  db.prepare(`DELETE FROM batch_tasks WHERE batch_id = ? AND task_id IN (${placeholders})`).run(id, ...taskIds);

  return getBatch(id, userId);
}

/**
 * Get batch statistics
 */
export function getBatchStats(id: string, userId: string): BatchStats | undefined {
  const db = getDb();

  const stats = db
    .prepare(`
      SELECT
        COUNT(t.id) as total,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(t.estimate_hours) as estimate_hours,
        SUM(t.estimate_minutes) as estimate_minutes
      FROM task_batches b
      JOIN batch_tasks bt ON b.id = bt.batch_id
      JOIN tasks t ON bt.task_id = t.id
      WHERE b.id = ? AND b.user_id = ?
    `)
    .get(id, userId) as {
      total: number;
      completed: number;
      pending: number;
      in_progress: number;
      estimate_hours: number;
      estimate_minutes: number;
    } | undefined;

  if (!stats) return undefined;

  return {
    totalTasks: stats.total,
    completedTasks: stats.completed,
    pendingTasks: stats.pending,
    inProgressTasks: stats.in_progress,
    totalEstimateHours: (stats.estimate_hours || 0) + Math.floor((stats.estimate_minutes || 0) / 60),
    totalActualHours: 0
  };
}

/**
 * Bulk create tasks in a batch
 */
export function createBatchWithTasks(userId: string, batchData: {
  name: string;
  description?: string;
  color?: string;
}, tasks: Array<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): { batch: TaskBatch; tasks: Task[] } {
  const db = getDb();
  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create batch
  db.prepare(`
    INSERT INTO task_batches (id, user_id, name, description, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(batchId, userId, batchData.name, batchData.description || '', batchData.color || '#3b82f6');

  // Create tasks
  const createdTasks: Task[] = [];
  const taskStmt = db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, list_id, date, deadline, priority, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const task of tasks) {
    const taskId = crypto.randomUUID();
    taskStmt.run(
      taskId,
      userId,
      task.title,
      task.description || '',
      task.listId || null,
      task.date || null,
      task.deadline || null,
      task.priority || 'none',
      task.status || 'pending',
      now,
      now
    );

    // Link to batch
    db.prepare('INSERT INTO batch_tasks (id, batch_id, task_id) VALUES (?, ?, ?)')
      .run(crypto.randomUUID(), batchId, taskId);

    createdTasks.push({
      id: taskId,
      userId,
      ...task,
      createdAt: now,
      updatedAt: now
    } as Task);
  }

  return {
    batch: getBatch(batchId, userId)!,
    tasks: createdTasks
  };
}

/**
 * Export batch to various formats
 */
export function exportBatch(id: string, userId: string, format: 'json' | 'csv' | 'markdown'): string {
  const batch = getBatch(id, userId);
  if (!batch) throw new Error('Batch not found');

  const db = getDb();
  const tasks = db
    .prepare(`
      SELECT t.*
      FROM tasks t
      JOIN batch_tasks bt ON t.id = bt.task_id
      WHERE bt.batch_id = ?
    `)
    .all(id) as Task[];

  switch (format) {
    case 'json':
      return JSON.stringify({ batch, tasks }, null, 2);

    case 'csv':
      const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date'];
      const rows = tasks.map(t => [t.id, t.title, t.description || '', t.status, t.priority, t.deadline || '']);
      return [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');

    case 'markdown':
      return `# ${batch.name}

${batch.description || ''}

## Tasks

${tasks.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] ${t.title}`).join('\n')}

`;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
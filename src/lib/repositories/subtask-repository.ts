/**
 * Subtask Repository
 * Handles all database operations related to subtasks
 */

import { getDb } from '../../db/index';
import type { Subtask } from '@/types/index';

export class SubtaskRepository {
  private db = getDb();

  findByTaskId(taskId: string): Subtask[] {
    return this.db.prepare(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC'
    ).all(taskId) as Subtask[];
  }

  findById(id: string): Subtask | undefined {
    return this.db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask | undefined;
  }

  create(data: { taskId: string; title: string }): Subtask {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const maxOrder = this.db.prepare(
      'SELECT COALESCE(MAX(sort_order), 0) as max FROM subtasks WHERE task_id = ?'
    ).get(data.taskId) as { max: number };

    this.db.prepare(
      'INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, ?, ?)'
    ).run(id, data.taskId, data.title, maxOrder.max + 1, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ title: string; isCompleted: boolean; sortOrder: number }>): Subtask {
    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.isCompleted !== undefined) { updates.push('is_completed = ?'); values.push(data.isCompleted ? 1 : 0); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(data.sortOrder); }
    values.push(id);

    this.db.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  toggle(id: string): Subtask {
    const subtask = this.findById(id);
    if (!subtask) throw new Error('Subtask not found');

    const newStatus = !subtask.isCompleted;
    this.db.prepare('UPDATE subtasks SET is_completed = ? WHERE id = ?').run(newStatus ? 1 : 0, id);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
  }

  deleteByTask(taskId: string): void {
    this.db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(taskId);
  }

  updateSortOrder(id: string, newPosition: number): void {
    this.db.prepare('UPDATE subtasks SET sort_order = ? WHERE id = ?').run(newPosition, id);
  }
}

let subtaskRepository: SubtaskRepository | null = null;

export function getSubtaskRepository(): SubtaskRepository {
  if (!subtaskRepository) {
    subtaskRepository = new SubtaskRepository();
  }
  return subtaskRepository;
}
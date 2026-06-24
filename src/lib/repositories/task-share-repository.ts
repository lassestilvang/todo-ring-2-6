/**
 * Task Share Repository
 * Handles all database operations related to task sharing
 */

import { getDb } from '../../db/index';
import type { TaskShare } from '@/types/index';

export class TaskShareRepository {
  private db = getDb();

  findByTaskId(taskId: string): TaskShare[] {
    return this.db.prepare(
      'SELECT * FROM task_shares WHERE task_id = ? ORDER BY created_at DESC'
    ).all(taskId) as TaskShare[];
  }

  findById(id: string): TaskShare | undefined {
    return this.db.prepare('SELECT * FROM task_shares WHERE id = ?').get(id) as TaskShare | undefined;
  }

  create(taskId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): TaskShare {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO task_shares (id, task_id, user_id, user_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, taskId, userId, userName, role, now);

    return this.findById(id)!;
  }

  delete(taskId: string, userId: string): void {
    this.db.prepare(
      'DELETE FROM task_shares WHERE task_id = ? AND user_id = ?'
    ).run(taskId, userId);
  }

  deleteByTaskId(taskId: string): void {
    this.db.prepare('DELETE FROM task_shares WHERE task_id = ?').run(taskId);
  }
}

let taskShareRepository: TaskShareRepository | null = null;

export function getTaskShareRepository(): TaskShareRepository {
  if (!taskShareRepository) {
    taskShareRepository = new TaskShareRepository();
  }
  return taskShareRepository;
}
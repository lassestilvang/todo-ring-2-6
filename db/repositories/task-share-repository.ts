import { BaseRepository } from './base-repository';
import type { TaskShare } from '../../src/types/index';

export class TaskShareRepository extends BaseRepository<TaskShare> {
  constructor() {
    super('task_shares');
  }

  getByTaskId(taskId: string): TaskShare[] {
    return this.db.prepare(
      'SELECT user_id as userId, user_name as userName, role FROM task_shares WHERE task_id = ?'
    ).all(taskId) as TaskShare[];
  }

  add(taskId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): TaskShare {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      'INSERT INTO task_shares (id, task_id, user_id, user_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, taskId, userId, userName, role, now);
    return { id, taskId, userId, userName, role, createdAt: now };
  }

  remove(taskId: string, userId: string): void {
    this.db.prepare('DELETE FROM task_shares WHERE task_id = ? AND user_id = ?').run(taskId, userId);
  }
}

export function getTaskShareRepository(): TaskShareRepository {
  return new TaskShareRepository();
}

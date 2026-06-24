/**
 * Task History Repository
 * Handles all database operations related to task history/audit log
 */

import { getDb } from '../../db/index';
import type { TaskHistory } from '@/types/index';

export class TaskHistoryRepository {
  private db = getDb();

  findByTaskId(taskId: string): TaskHistory[] {
    return this.db.prepare(
      'SELECT * FROM task_history WHERE task_id = ? ORDER BY performed_at DESC'
    ).all(taskId) as TaskHistory[];
  }

  findById(id: string): TaskHistory | undefined {
    return this.db.prepare('SELECT * FROM task_history WHERE id = ?').get(id) as TaskHistory | undefined;
  }

  create(data: {
    taskId: string;
    action: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
  }): TaskHistory {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO task_history (id, task_id, action, field_changed, old_value, new_value, performed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.taskId, data.action, data.fieldChanged || null, data.oldValue || null, data.newValue || null, now);

    return this.findById(id)!;
  }

  deleteByTaskId(taskId: string): void {
    this.db.prepare('DELETE FROM task_history WHERE task_id = ?').run(taskId);
  }
}

let taskHistoryRepository: TaskHistoryRepository | null = null;

export function getTaskHistoryRepository(): TaskHistoryRepository {
  if (!taskHistoryRepository) {
    taskHistoryRepository = new TaskHistoryRepository();
  }
  return taskHistoryRepository;
}
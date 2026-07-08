/**
 * Task History Repository
 * Handles all database operations related to task history/audit log and version tracking
 */

import { getDb } from '../../db/index';
import type { TaskHistory, TaskVersion } from '@/types/index';

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
    performedBy?: string;
    performedByName?: string;
    version?: number;
  }): TaskHistory {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO task_history (id, task_id, action, field_changed, old_value, new_value, performed_at, performed_by, performed_by_name, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.taskId, data.action, data.fieldChanged || null, data.oldValue || null, data.newValue || null, now, data.performedBy || null, data.performedByName || null, data.version || 1);

    return this.findById(id)!;
  }

  deleteByTaskId(taskId: string): void {
    this.db.prepare('DELETE FROM task_history WHERE task_id = ?').run(taskId);
  }

  /**
   * Record task version for OT history
   */
  recordVersion(data: {
    taskId: string;
    version: number;
    operation: TaskVersion['operation'];
    performedBy: string;
    performedByName: string;
  }): TaskVersion {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO task_versions (id, task_id, version, operation_type, operation_path, operation_value, operation_position, performed_by, performed_by_name, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      data.taskId,
      data.version,
      data.operation.type,
      JSON.stringify(data.operation.path),
      data.operation.value ? JSON.stringify(data.operation.value) : null,
      data.operation.position || null,
      data.performedBy,
      data.performedByName,
      now
    );

    return {
      id,
      taskId: data.taskId,
      version: data.version,
      data: {},
      operation: data.operation,
      performedBy: data.performedBy,
      performedByName: data.performedByName,
      timestamp: now,
    };
  }

  /**
   * Get task version history
   */
  getVersions(taskId: string, limit: number = 50): TaskVersion[] {
    const rows = this.db.prepare(
      'SELECT * FROM task_versions WHERE task_id = ? ORDER BY version DESC LIMIT ?'
    ).all(taskId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      version: row.version,
      data: {},
      operation: {
        type: row.operation_type,
        path: JSON.parse(row.operation_path),
        value: row.operation_value ? JSON.parse(row.operation_value) : undefined,
        position: row.operation_position,
      },
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Get latest version number for a task
   */
  getLatestVersion(taskId: string): number {
    const row = this.db.prepare(
      'SELECT MAX(version) as version FROM task_versions WHERE task_id = ?'
    ).get(taskId) as { version: number | null };
    return row.version || 0;
  }
}

let taskHistoryRepository: TaskHistoryRepository | null = null;

export function getTaskHistoryRepository(): TaskHistoryRepository {
  if (!taskHistoryRepository) {
    taskHistoryRepository = new TaskHistoryRepository();
  }
  return taskHistoryRepository;
}
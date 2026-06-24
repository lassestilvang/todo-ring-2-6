/**
 * Task Dependency Repository
 * Handles all database operations related to task dependencies
 */

import { getDb } from '../../db/index';
import type { TaskDependency } from '@/types/index';

export class TaskDependencyRepository {
  private db = getDb();

  findByTaskId(taskId: string): TaskDependency[] {
    return this.db.prepare(
      `SELECT td.* FROM task_dependencies td
       WHERE td.task_id = ?
       ORDER BY td.created_at DESC`
    ).all(taskId) as TaskDependency[];
  }

  findById(id: string): TaskDependency | undefined {
    return this.db.prepare('SELECT * FROM task_dependencies WHERE id = ?').get(id) as TaskDependency | undefined;
  }

  create(taskId: string, dependsOnId: string): TaskDependency {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Check for circular dependency
    const existing = this.db.prepare(
      'SELECT id FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?'
    ).get(dependsOnId, taskId);
    if (existing) {
      throw new Error('Circular dependency detected');
    }

    this.db.prepare(
      'INSERT INTO task_dependencies (id, task_id, depends_on_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, taskId, dependsOnId, now);

    return this.findById(id)!;
  }

  delete(taskId: string, dependsOnId: string): void {
    this.db.prepare(
      'DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?'
    ).run(taskId, dependsOnId);
  }

  deleteByTaskId(taskId: string): void {
    this.db.prepare('DELETE FROM task_dependencies WHERE task_id = ?').run(taskId);
  }

  getDependents(taskId: string): TaskDependency[] {
    return this.db.prepare(
      `SELECT td.* FROM task_dependencies td
       WHERE td.depends_on_id = ?
       ORDER BY td.created_at DESC`
    ).all(taskId) as TaskDependency[];
  }

  /**
   * Get all tasks that are blocked by a specific task
   */
  getBlockedTasks(): any[] {
    return this.db.prepare(
      `SELECT DISTINCT t.* FROM tasks t
       JOIN task_dependencies td ON t.id = td.task_id
       JOIN tasks deps ON td.depends_on_id = deps.id
       WHERE deps.status NOT IN ('completed', 'cancelled')`
    ).all() as any[];
  }

  /**
   * Check if a task can be completed (no incomplete dependencies)
   */
  canCompleteTask(taskId: string): boolean {
    const blockedBy = this.db.prepare(
      `SELECT deps.id, deps.title, deps.status FROM task_dependencies td
       JOIN tasks deps ON td.depends_on_id = deps.id
       WHERE td.task_id = ?`
    ).all(taskId) as { id: string; title: string; status: string }[];

    return blockedBy.length === 0 || blockedBy.every(d => d.status === 'completed' || d.status === 'cancelled');
  }
}

let taskDependencyRepository: TaskDependencyRepository | null = null;

export function getTaskDependencyRepository(): TaskDependencyRepository {
  if (!taskDependencyRepository) {
    taskDependencyRepository = new TaskDependencyRepository();
  }
  return taskDependencyRepository;
}
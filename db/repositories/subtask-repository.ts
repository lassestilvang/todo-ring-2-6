import { BaseRepository } from './base-repository';
import type { Subtask } from '../../src/types/index';

/**
 * Subtask repository for database operations related to subtasks
 */
export class SubtaskRepository extends BaseRepository<Subtask> {
  constructor() {
    super('subtasks');
  }

  /**
   * Get subtasks by task ID
   */
  getByTaskId(taskId: string): Subtask[] {
    return this.db.prepare(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC'
    ).all(taskId) as Subtask[];
  }

  /**
   * Create a new subtask
   */
  create(data: { taskId: string; title: string }): Subtask {
    const id = this.generateId();
    const maxOrder = this.db.prepare(
      'SELECT COALESCE(MAX(sort_order), 0) as max FROM subtasks WHERE task_id = ?'
    ).get(data.taskId) as { max: number };

    this.db.prepare(
      'INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, ?, ?)'
    )
      .run(id, data.taskId, data.title, maxOrder.max + 1, this.now());

    return this.findById(id)!;
  }

  /**
   * Toggle subtask completion
   */
  toggle(id: string): Subtask {
    const subtask = this.findById(id);
    if (!subtask) throw new Error('Subtask not found');

    const newStatus = !subtask.isCompleted;
    this.db.prepare('UPDATE subtasks SET is_completed = ? WHERE id = ?').run(newStatus ? 1 : 0, id);
    return this.findById(id)!;
  }

  /**
   * Delete subtask
   */
  delete(id: string): void {
    this.db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
  }
}
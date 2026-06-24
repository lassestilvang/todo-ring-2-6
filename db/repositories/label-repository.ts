import { BaseRepository } from './base-repository';
import type { Label, Task } from '../../src/types/index';

/**
 * Label repository for database operations related to labels
 */
export class LabelRepository extends BaseRepository<Label> {
  constructor() {
    super('labels');
  }

  /**
   * Create a new label
   */
  create(data: { name: string; color: string; icon?: string }): Label {
    const id = this.generateId();
    const now = this.now();

    this.db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, data.name, data.color, data.icon || '🏷', now);

    return this.findById(id)!;
  }

  /**
   * Update a label
   */
  update(id: string, data: Partial<{ name: string; color: string; icon: string }>): Label {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    values.push(id);

    this.db.prepare(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  /**
   * Get tasks by label ID
   */
  getTasksByLabel(labelId: string): Task[] {
    const tasks = this.db.prepare(`
      SELECT t.* FROM tasks t
      JOIN task_labels tl ON t.id = tl.task_id
      WHERE tl.label_id = ?
      ORDER BY t.sort_order ASC, t.created_at DESC
    `).all(labelId) as Task[];
    return tasks;
  }

  /**
   * Get tasks with all specified labels (AND condition)
   */
  getTasksByLabels(labelIds: string[]): Task[] {
    if (labelIds.length === 0) return [];

    const tasks = this.db.prepare(`
      SELECT t.*, COUNT(tl.label_id) as label_count
      FROM tasks t
      JOIN task_labels tl ON t.id = tl.task_id
      WHERE tl.label_id IN (${labelIds.map(() => '?').join(',')})
      GROUP BY t.id
      HAVING COUNT(tl.label_id) = ?
      ORDER BY t.sort_order ASC, t.created_at DESC
    `).all(...labelIds, labelIds.length) as Task[];

    return tasks;
  }

  /**
   * Add label to task
   */
  addLabelToTask(taskId: string, labelId: string): void {
    this.db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)').run(taskId, labelId);
  }

  /**
   * Remove label from task
   */
  removeLabelFromTask(taskId: string, labelId: string): void {
    this.db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(taskId, labelId);
  }
}
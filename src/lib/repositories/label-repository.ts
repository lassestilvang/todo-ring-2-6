/**
 * Label Repository
 * Handles all database operations related to labels
 */

import { getDb } from '../../db/index';
import type { Label, Task } from '@/types/index';

export class LabelRepository {
  private db = getDb();

  findAll(): Label[] {
    return this.db.prepare(
      'SELECT * FROM labels ORDER BY created_at DESC'
    ).all() as Label[];
  }

  findById(id: string): Label | undefined {
    return this.db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label | undefined;
  }

  findByName(name: string): Label | undefined {
    return this.db.prepare('SELECT * FROM labels WHERE name = ?').get(name) as Label | undefined;
  }

  create(data: { name: string; color: string; icon?: string }): Label {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, data.name, data.color, data.icon || '', now);

    return this.findById(id)!;
  }

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

  delete(id: string): void {
    this.db.prepare('DELETE FROM labels WHERE id = ?').run(id);
  }

  /**
   * Get all tasks that have a specific label attached
   */
  getTasksByLabel(labelId: string): Task[] {
    return this.db.prepare(`
      SELECT t.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      JOIN tasks t ON tl.task_id = t.id
      WHERE l.id = ?
      ORDER BY t.sort_order ASC, t.created_at DESC
    `).all(labelId) as Task[];
  }

  /**
   * Get tasks that have ALL of the specified labels
   */
  getTasksByLabels(labelIds: string[]): Task[] {
    if (labelIds.length === 0) return [];

    // Build placeholders for each label
    const placeholders = labelIds.map(() => '?').join(',');

    return this.db.prepare(`
      SELECT t.* FROM tasks t
      WHERE t.id IN (
        SELECT tl.task_id FROM task_labels tl
        WHERE tl.label_id IN (${placeholders})
        GROUP BY tl.task_id
        HAVING COUNT(DISTINCT tl.label_id) = ?
      )
      ORDER BY t.sort_order ASC, t.created_at DESC
    `).all(...labelIds, labelIds.length) as Task[];
  }

  /**
   * Add a label to a task
   */
  addLabelToTask(taskId: string, labelId: string): void {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT OR IGNORE INTO task_labels (id, task_id, label_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, taskId, labelId, now);
  }

  /**
   * Remove a label from a task
   */
  removeLabelFromTask(taskId: string, labelId: string): void {
    this.db.prepare(
      'DELETE FROM task_labels WHERE task_id = ? AND label_id = ?'
    ).run(taskId, labelId);
  }

  /**
   * Get all labels for a specific task
   */
  getLabelsForTask(taskId: string): Label[] {
    return this.db.prepare(`
      SELECT l.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = ?
      ORDER BY l.created_at DESC
    `).all(taskId) as Label[];
  }

  /**
   * Alias for getLabelsForTask - for API compatibility
   */
  findByTask(taskId: string): Label[] {
    return this.getLabelsForTask(taskId);
  }

  /**
   * Alias for addLabelToTask - for API compatibility
   */
  assignToTask(taskId: string, labelId: string): void {
    this.addLabelToTask(taskId, labelId);
  }

  /**
   * Alias for removeLabelFromTask - for API compatibility
   */
  removeFromTask(taskId: string, labelId: string): void {
    this.removeLabelFromTask(taskId, labelId);
  }
}

let labelRepository: LabelRepository | null = null;

export function getLabelRepository(): LabelRepository {
  if (!labelRepository) {
    labelRepository = new LabelRepository();
  }
  return labelRepository;
}
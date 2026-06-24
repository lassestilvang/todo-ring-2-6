import { BaseRepository } from './base-repository';
import type { List } from '../../src/types/index';

/**
 * List repository for database operations related to lists
 */
export class ListRepository extends BaseRepository<List> {
  constructor() {
    super('lists');
  }

  /**
   * Get the inbox list (creates it if it doesn't exist)
   */
  getInbox(): List {
    let list = this.db.prepare("SELECT * FROM lists WHERE is_inbox = 1").get() as List | undefined;
    if (!list) {
      const id = this.generateId();
      const now = this.now();
      this.db.prepare(
        'INSERT INTO lists (id, name, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, 1, 0, ?, ?)'
      ).run(id, 'Inbox', '📥', now, now);
      list = this.findById(id)!;
    }
    return list;
  }

  /**
   * Create a new list
   */
  create(data: { name: string; color: string; emoji: string }): List {
    const id = this.generateId();
    const now = this.now();
    const maxOrder = this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max').get() as { max: number };

    this.db.prepare(
      'INSERT INTO lists (id, name, color, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
    ).run(id, data.name, data.color, data.emoji, maxOrder.max + 1, now, now);

    return this.findById(id)!;
  }

  /**
   * Update a list
   */
  update(id: string, data: Partial<{ name: string; color: string; emoji: string }>): List {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.emoji !== undefined) { updates.push('emoji = ?'); values.push(data.emoji); }
    updates.push('updated_at = ?'); values.push(this.now());
    values.push(id);

    this.db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  /**
   * Delete a list (only if not inbox)
   */
  delete(id: string): void {
    this.db.prepare('DELETE FROM lists WHERE id = ? AND is_inbox = 0').run(id);
  }

  /**
   * Update list sort order
   */
  updateSortOrder(listId: string, newPosition: number): List {
    const list = this.findById(listId);
    if (!list) throw new Error('List not found');

    const oldPosition = list.sortOrder;

    if (newPosition > oldPosition) {
      this.db.prepare(
        'UPDATE lists SET sort_order = sort_order - 1 WHERE sort_order > ? AND sort_order <= ?'
      ).run(oldPosition, newPosition);
    } else if (newPosition < oldPosition) {
      this.db.prepare(
        'UPDATE lists SET sort_order = sort_order + 1 WHERE sort_order >= ? AND sort_order < ?'
      ).run(newPosition, oldPosition);
    }

    this.db.prepare('UPDATE lists SET sort_order = ? WHERE id = ?').run(newPosition, listId);
    return this.findById(listId)!;
  }

  /**
   * Check if list can be deleted
   */
  canDelete(id: string): boolean {
    const list = this.findById(id);
    return !!(list && !list.isInbox);
  }
}
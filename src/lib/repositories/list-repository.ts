/**
 * List Repository
 * Handles all database operations related to lists
 */

import { getDb } from '@/db/index';
import type { List } from '@/types/index';

export class ListRepository {
  private db = getDb();

  findAll(): List[] {
    return this.db.prepare(
      'SELECT * FROM lists ORDER BY sort_order ASC, created_at DESC'
    ).all() as List[];
  }

  findById(id: string): List | undefined {
    return this.db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List | undefined;
  }

  findInbox(): List {
    let list = this.db.prepare('SELECT * FROM lists WHERE is_inbox = 1').get() as List | undefined;

    if (!list) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      this.db.prepare(
        'INSERT INTO lists (id, name, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, 1, 0, ?, ?)'
      ).run(id, 'Inbox', '📥', now, now);
      list = this.findById(id)!;
    }

    return list;
  }

  create(data: { name: string; color: string; emoji: string }): List {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const maxOrder = this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max FROM lists').get() as { max: number };

    this.db.prepare(
      'INSERT INTO lists (id, name, color, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
    ).run(id, data.name, data.color, data.emoji, maxOrder.max + 1, now, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ name: string; color: string; emoji: string }>): List {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.emoji !== undefined) { updates.push('emoji = ?'); values.push(data.emoji); }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM lists WHERE id = ? AND is_inbox = 0').run(id);
  }

  updateSortOrder(id: string, newPosition: number): List {
    const list = this.findById(id);
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

    this.db.prepare('UPDATE lists SET sort_order = ? WHERE id = ?').run(newPosition, id);

    return this.findById(id)!;
  }
}

let listRepository: ListRepository | null = null;

export function getListRepository(): ListRepository {
  if (!listRepository) {
    listRepository = new ListRepository();
  }
  return listRepository;
}
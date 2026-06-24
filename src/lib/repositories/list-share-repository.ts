/**
 * List Share Repository
 * Handles all database operations related to list sharing
 */

import { getDb } from '../../db/index';
import type { ListShare } from '@/types/index';

export class ListShareRepository {
  private db = getDb();

  findByListId(listId: string): ListShare[] {
    return this.db.prepare(
      'SELECT * FROM list_shares WHERE list_id = ? ORDER BY created_at DESC'
    ).all(listId) as ListShare[];
  }

  findById(id: string): ListShare | undefined {
    return this.db.prepare('SELECT * FROM list_shares WHERE id = ?').get(id) as ListShare | undefined;
  }

  create(listId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): ListShare {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO list_shares (id, list_id, user_id, user_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, listId, userId, userName, role, now);

    return this.findById(id)!;
  }

  delete(listId: string, userId: string): void {
    this.db.prepare(
      'DELETE FROM list_shares WHERE list_id = ? AND user_id = ?'
    ).run(listId, userId);
  }

  deleteByListId(listId: string): void {
    this.db.prepare('DELETE FROM list_shares WHERE list_id = ?').run(listId);
  }
}

let listShareRepository: ListShareRepository | null = null;

export function getListShareRepository(): ListShareRepository {
  if (!listShareRepository) {
    listShareRepository = new ListShareRepository();
  }
  return listShareRepository;
}
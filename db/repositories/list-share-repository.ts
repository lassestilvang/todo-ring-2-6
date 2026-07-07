import { BaseRepository } from './base-repository';
import type { ListShare } from '../../src/types/index';

export class ListShareRepository extends BaseRepository<ListShare> {
  constructor() {
    super('list_shares');
  }

  getByListId(listId: string): ListShare[] {
    return this.db.prepare(
      'SELECT user_id as userId, user_name as userName, role FROM list_shares WHERE list_id = ?'
    ).all(listId) as ListShare[];
  }

  add(listId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): ListShare {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      'INSERT INTO list_shares (id, list_id, user_id, user_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, listId, userId, userName, role, now);
    return { id, listId, userId, userName, role, createdAt: now };
  }

  remove(listId: string, userId: string): void {
    this.db.prepare('DELETE FROM list_shares WHERE list_id = ? AND user_id = ?').run(listId, userId);
  }
}

export function getListShareRepository(): ListShareRepository {
  return new ListShareRepository();
}

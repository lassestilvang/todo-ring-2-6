/**
 * User Repository
 * Handles all database operations related to users
 */

import { getDb } from '../../db/index';
import type { User } from '@/types/index';

export class UserRepository {
  private db = getDb();

  findAll(): User[] {
    return this.db.prepare(
      'SELECT * FROM users ORDER BY created_at DESC'
    ).all() as User[];
  }

  findById(id: string): User | undefined {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  }

  findByEmail(email: string): User | undefined {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  }

  create(data: { name: string; email: string; password?: string; avatar?: string }): User {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO users (id, name, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.name, data.email, data.password || null, data.avatar || null, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ name: string; email: string; password: string; avatar: string }>): User {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email); }
    if (data.password !== undefined) { updates.push('password = ?'); values.push(data.password); }
    if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }
    values.push(id);

    this.db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
}

let userRepository: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = new UserRepository();
  }
  return userRepository;
}
import { BaseRepository } from './base-repository';
import type { User } from '../../src/types/index';

/**
 * User repository for database operations related to users
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   */
  findByEmail(email: string): User | undefined {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  }

  /**
   * Create a new user
   */
  create(data: { name: string; email: string; password?: string; avatar?: string }): User {
    const id = this.generateId();
    const now = this.now();

    this.db.prepare(
      'INSERT INTO users (id, name, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.name, data.email, data.password || null, data.avatar || null, now);

    return this.findById(id)!;
  }

  /**
   * Update user
   */
  update(id: string, data: Partial<{ name: string; email: string; password: string; avatar: string }>): User {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email); }
    if (data.password !== undefined) { updates.push('password = ?'); values.push(data.password); }
    if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }
    updates.push('updated_at = ?'); values.push(this.now());
    values.push(id);

    this.db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  /**
   * Delete user and all associated data
   */
  delete(id: string): void {
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
}
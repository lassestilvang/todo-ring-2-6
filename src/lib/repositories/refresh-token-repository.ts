/**
 * Refresh Token Repository
 * Handles all database operations related to JWT refresh tokens
 */

import { getDb } from '../../db/index';
import type { RefreshToken } from '@/types/index';

export class RefreshTokenRepository {
  private db = getDb();

  findById(id: string): RefreshToken | undefined {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE id = ? AND expires_at > ?'
    ).get(id, new Date().toISOString()) as RefreshToken | undefined;
  }

  findByToken(token: string): RefreshToken | undefined {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > ?'
    ).get(token, new Date().toISOString()) as RefreshToken | undefined;
  }

  findByUserId(userId: string): RefreshToken[] {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC'
    ).all(userId, new Date().toISOString()) as RefreshToken[];
  }

  create(userId: string): RefreshToken {
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.db.prepare(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, token, expiresAt, now);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(id);
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
  }

  deleteByToken(token: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
  }

  deleteExpired(): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(new Date().toISOString());
  }
}

let refreshTokenRepository: RefreshTokenRepository | null = null;

export function getRefreshTokenRepository(): RefreshTokenRepository {
  if (!refreshTokenRepository) {
    refreshTokenRepository = new RefreshTokenRepository();
  }
  return refreshTokenRepository;
}
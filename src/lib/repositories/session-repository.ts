/**
 * Session Repository
 * Handles all database operations related to user sessions
 */

import { getDb } from '../../db/index';
import type { Session } from '@/types/index';

export class SessionRepository {
  private db = getDb();

  findById(id: string): Session | undefined {
    return this.db.prepare(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > ?'
    ).get(id, new Date().toISOString()) as Session | undefined;
  }

  findByUserId(userId: string): Session[] {
    return this.db.prepare(
      'SELECT * FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC'
    ).all(userId, new Date().toISOString()) as Session[];
  }

  create(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Session {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.db.prepare(
      'INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.userId, data.ipAddress || null, data.userAgent || null, expiresAt, now);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }

  deleteExpired(): void {
    this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  }
}

let sessionRepository: SessionRepository | null = null;

export function getSessionRepository(): SessionRepository {
  if (!sessionRepository) {
    sessionRepository = new SessionRepository();
  }
  return sessionRepository;
}
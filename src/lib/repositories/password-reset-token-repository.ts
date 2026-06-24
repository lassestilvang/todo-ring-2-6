/**
 * Password Reset Token Repository
 * Handles all database operations related to password reset tokens
 */

import { getDb } from '../../db/index';
import type { PasswordResetToken } from '@/types/index';

export class PasswordResetTokenRepository {
  private db = getDb();

  findById(id: string): PasswordResetToken | undefined {
    return this.db.prepare('SELECT * FROM password_reset_tokens WHERE id = ?').get(id) as PasswordResetToken | undefined;
  }

  findByToken(token: string): PasswordResetToken | undefined {
    return this.db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token) as PasswordResetToken | undefined;
  }

  findByUserId(userId: string): PasswordResetToken[] {
    return this.db.prepare(
      'SELECT * FROM password_reset_tokens WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as PasswordResetToken[];
  }

  create(userId: string): PasswordResetToken {
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    this.db.prepare(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    ).run(id, userId, token, expiresAt, now);

    return this.findById(id)!;
  }

  markAsUsed(id: string): void {
    this.db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(id);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(id);
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(userId);
  }

  deleteExpired(): void {
    this.db.prepare('DELETE FROM password_reset_tokens WHERE expires_at < ? OR used = 1').run(new Date().toISOString());
  }
}

let passwordResetTokenRepository: PasswordResetTokenRepository | null = null;

export function getPasswordResetTokenRepository(): PasswordResetTokenRepository {
  if (!passwordResetTokenRepository) {
    passwordResetTokenRepository = new PasswordResetTokenRepository();
  }
  return passwordResetTokenRepository;
}
/**
 * MFA Secret Repository
 * Handles all database operations related to MFA secrets
 */

import { getDb } from '../../db/index';
import type { MfaSecret } from '@/types/index';

export class MfaSecretRepository {
  private db = getDb();

  findByUserId(userId: string): MfaSecret | undefined {
    return this.db.prepare('SELECT * FROM mfa_secrets WHERE user_id = ?').get(userId) as MfaSecret | undefined;
  }

  findById(id: string): MfaSecret | undefined {
    return this.db.prepare('SELECT * FROM mfa_secrets WHERE id = ?').get(id) as MfaSecret | undefined;
  }

  create(userId: string, secret: string): MfaSecret {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO mfa_secrets (id, user_id, secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, secret, now, now);

    return this.findById(id)!;
  }

  update(userId: string, secret: string): MfaSecret {
    const now = new Date().toISOString();

    // Delete existing and create new
    this.deleteByUserId(userId);

    return this.create(userId, secret);
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM mfa_secrets WHERE user_id = ?').run(userId);
  }
}

let mfaSecretRepository: MfaSecretRepository | null = null;

export function getMfaSecretRepository(): MfaSecretRepository {
  if (!mfaSecretRepository) {
    mfaSecretRepository = new MfaSecretRepository();
  }
  return mfaSecretRepository;
}
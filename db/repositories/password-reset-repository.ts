import { BaseRepository } from './base-repository';
import type { PasswordResetToken } from '../../src/types/index';

export class PasswordResetRepository extends BaseRepository<PasswordResetToken> {
  constructor() {
    super('password_reset_tokens');
  }

  getByToken(token: string): PasswordResetToken | undefined {
    return this.db.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0'
    ).get(token) as PasswordResetToken | undefined;
  }

  markUsed(token: string): void {
    this.db.prepare(
      'UPDATE password_reset_tokens SET used = 1, updated_at = ? WHERE token = ?'
    ).run(new Date().toISOString(), token);
  }
}

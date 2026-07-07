import { BaseRepository } from './base-repository';
import type { MfaSecret } from '../../src/types/index';

export class MfaRepository extends BaseRepository<MfaSecret> {
  constructor() {
    super('mfa_secrets');
  }

  getByUserId(userId: string): MfaSecret | undefined {
    return this.db.prepare(
      'SELECT * FROM mfa_secrets WHERE user_id = ?'
    ).get(userId) as MfaSecret | undefined;
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM mfa_secrets WHERE user_id = ?').run(userId);
  }
}

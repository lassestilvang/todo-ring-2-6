import { BaseRepository } from './base-repository';
import type { RefreshToken } from '../../src/types/index';

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor() {
    super('refresh_tokens');
  }

  getByToken(token: string): RefreshToken | undefined {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE token = ?'
    ).get(token) as RefreshToken | undefined;
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
  }

  deleteExpired(): void {
    const now = new Date().toISOString();
    this.db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(now);
  }
}

export function getRefreshTokenRepository(): RefreshTokenRepository {
  return new RefreshTokenRepository();
}

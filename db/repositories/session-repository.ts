import { BaseRepository } from './base-repository';
import type { Session } from '../../src/types/index';

export class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super('sessions');
  }

  getByUserId(userId: string): Session | undefined {
    return this.db.prepare(
      'SELECT * FROM sessions WHERE user_id = ?'
    ).get(userId) as Session | undefined;
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }
}

export function getSessionRepository(): SessionRepository {
  return new SessionRepository();
}

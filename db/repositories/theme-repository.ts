import { BaseRepository } from './base-repository';
import type { Theme } from '../../src/types/index';

export class ThemeRepository extends BaseRepository<Theme> {
  constructor() {
    super('themes', { timestamps: true });
  }

  /**
   * Get all public/custom themes
   */
  getAll(options?: { customOnly?: boolean }): Theme[] {
    let query = 'SELECT * FROM themes';
    const params: any[] = [];

    if (options?.customOnly) {
      query += ' WHERE is_custom = 1';
    }

    return this.db.prepare(query + ' ORDER BY created_at DESC').all(...params) as Theme[];
  }

  /**
   * Get themes by creator
   */
  getByCreator(userId: string): Theme[] {
    return this.db.prepare(
      'SELECT * FROM themes WHERE created_by = ? ORDER BY created_at DESC'
    ).all(userId) as Theme[];
  }

  /**
   * Get default themes
   */
  getDefaults(): Theme[] {
    return this.db.prepare(
      'SELECT * FROM themes WHERE is_custom = 0 ORDER BY name ASC'
    ).all() as Theme[];
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private now(): string {
    return new Date().toISOString();
  }
}
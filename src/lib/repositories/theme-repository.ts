/**
 * Theme Repository
 * Handles all database operations related to themes
 */

import { getDb } from '../../db/index';
import type { Theme } from '@/types/index';

export class ThemeRepository {
  private db = getDb();

  findAll(): Theme[] {
    return this.db.prepare(
      'SELECT * FROM themes ORDER BY created_at DESC'
    ).all() as Theme[];
  }

  findById(id: string): Theme | undefined {
    return this.db.prepare('SELECT * FROM themes WHERE id = ?').get(id) as Theme | undefined;
  }

  findByCreatedBy(createdBy: string): Theme[] {
    return this.db.prepare(
      'SELECT * FROM themes WHERE created_by = ? ORDER BY created_at DESC'
    ).all(createdBy) as Theme[];
  }

  findCustomThemes(): Theme[] {
    return this.db.prepare(
      'SELECT * FROM themes WHERE is_custom = 1 ORDER BY created_at DESC'
    ).all() as Theme[];
  }

  create(data: { name: string; colors: Record<string, string>; emoji?: string; createdBy?: string }): Theme {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO themes (id, name, colors, emoji, is_custom, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)'
    ).run(id, data.name, JSON.stringify(data.colors), data.emoji || '🎨', data.createdBy || null, now, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ name: string; colors: Record<string, string>; emoji: string }>): Theme {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.colors !== undefined) { updates.push('colors = ?'); values.push(JSON.stringify(data.colors)); }
    if (data.emoji !== undefined) { updates.push('emoji = ?'); values.push(data.emoji); }
    values.push(id);

    this.db.prepare(`UPDATE themes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM themes WHERE id = ? AND is_custom = 1').run(id);
  }
}

let themeRepository: ThemeRepository | null = null;

export function getThemeRepository(): ThemeRepository {
  if (!themeRepository) {
    themeRepository = new ThemeRepository();
  }
  return themeRepository;
}
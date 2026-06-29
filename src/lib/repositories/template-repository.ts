/**
 * Template Repository
 * Handles all database operations related to task templates
 */

import { getDb } from '../../db/index';
import type { TaskTemplate, TemplateRating } from '@/types/index';

export class TemplateRepository {
  private db = getDb();

  findAll(sortBy: 'usage_count' | 'avg_rating' | 'created_at' | 'name' = 'usage_count', limit: number = 20): TaskTemplate[] {
    const validSortColumns = ['usage_count', 'avg_rating', 'created_at', 'name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'usage_count';

    return this.db.prepare(
      `SELECT * FROM task_templates ORDER BY ${sortColumn} DESC LIMIT ?`
    ).all(limit) as TaskTemplate[];
  }

  findById(id: string): TaskTemplate | undefined {
    return this.db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TaskTemplate | undefined;
  }

  findByCategory(category: string, sortBy?: string, limit: number = 20): TaskTemplate[] {
    let query = 'SELECT * FROM task_templates WHERE category = ?';
    const values = [category];

    const validSortColumns = ['usage_count', 'avg_rating', 'created_at', 'name'];
    const sortColumn = sortBy && validSortColumns.includes(sortBy) ? sortBy : 'usage_count';
    query += ` ORDER BY ${sortColumn} DESC LIMIT ?`;
    values.push(limit);

    return this.db.prepare(query).all(...values) as TaskTemplate[];
  }

  findPublic(sortBy?: string, limit: number = 20): TaskTemplate[] {
    let query = 'SELECT * FROM task_templates WHERE is_public = 1';
    const values: any[] = [];

    const validSortColumns = ['usage_count', 'avg_rating', 'created_at', 'name'];
    const sortColumn = sortBy && validSortColumns.includes(sortBy) ? sortBy : 'usage_count';
    query += ` ORDER BY ${sortColumn} DESC LIMIT ?`;
    values.push(limit);

    return this.db.prepare(query).all(...values) as TaskTemplate[];
  }

  findByCreatedBy(createdBy: string): TaskTemplate[] {
    return this.db.prepare(
      'SELECT * FROM task_templates WHERE created_by = ? ORDER BY created_at DESC'
    ).all(createdBy) as TaskTemplate[];
  }

  create(data: {
    name: string;
    icon?: string;
    title: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low' | 'none';
    estimateHours?: number;
    estimateMinutes?: number;
    isAllDay?: boolean;
    recurringType?: string;
    labelIds?: string[];
    category?: string;
    createdBy?: string;
  }): TaskTemplate {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO task_templates
       (id, name, icon, title, description, priority, estimate_hours, estimate_minutes,
        is_all_day, recurring_type, recurring_interval, label_ids, category, created_by,
        created_at, updated_at, usage_count, avg_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`
    ).run(
      id,
      data.name,
      data.icon || '📋',
      data.title,
      data.description || '',
      data.priority || 'none',
      data.estimateHours || 0,
      data.estimateMinutes || 0,
      data.isAllDay ? 1 : 0,
      data.recurringType || 'none',
      '',
      JSON.stringify(data.labelIds || []),
      data.category || 'general',
      data.createdBy || null,
      now,
      now
    );

    return this.findById(id)!;
  }

  updateUsageCount(id: string): void {
    this.db.prepare(
      'UPDATE task_templates SET usage_count = usage_count + 1 WHERE id = ?'
    ).run(id);
  }

  update(id: string, data: Partial<Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>>): TaskTemplate {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
    if (data.estimateHours !== undefined) { updates.push('estimate_hours = ?'); values.push(data.estimateHours); }
    if (data.estimateMinutes !== undefined) { updates.push('estimate_minutes = ?'); values.push(data.estimateMinutes); }
    if (data.isAllDay !== undefined) { updates.push('is_all_day = ?'); values.push(data.isAllDay ? 1 : 0); }
    if (data.recurringType !== undefined) { updates.push('recurring_type = ?'); values.push(data.recurringType); }
    if (data.labelIds !== undefined) { updates.push('label_ids = ?'); values.push(JSON.stringify(data.labelIds)); }
    if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
    if (data.createdBy !== undefined) { updates.push('created_by = ?'); values.push(data.createdBy); }

    values.push(id);

    this.db.prepare(`UPDATE task_templates SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`).run(
      ...values,
      new Date().toISOString(),
      id
    );

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
  }

  // Rating operations
  getRatings(templateId: string): TemplateRating[] {
    return this.db.prepare(
      'SELECT * FROM template_ratings WHERE template_id = ? ORDER BY created_at DESC'
    ).all(templateId) as TemplateRating[];
  }

  rateTemplate(templateId: string, rating: number, userId?: string): TemplateRating {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO template_ratings (id, template_id, user_id, rating, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, templateId, userId || null, rating, now);

    // Update average rating
    const stats = this.db.prepare(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM template_ratings WHERE template_id = ?'
    ).get(templateId) as { avg_rating: number; count: number };

    this.db.prepare(
      'UPDATE task_templates SET avg_rating = ? WHERE id = ?'
    ).run(stats.avg_rating, templateId);

    this.updateUsageCount(templateId);

    return this.db.prepare('SELECT * FROM template_ratings WHERE id = ?').get(id) as TemplateRating;
  }

  getUserRating(templateId: string, userId: string): TemplateRating | undefined {
    return this.db.prepare(
      'SELECT * FROM template_ratings WHERE template_id = ? AND user_id = ?'
    ).get(templateId, userId) as TemplateRating | undefined;
  }
}

// Helper function to get user's rating
export async function getUserTemplateRating(templateId: string, userId: string): Promise<TemplateRating | null> {
  const repo = getTemplateRepository();
  return repo.getUserRating(templateId, userId) || null;
}

let templateRepository: TemplateRepository | null = null;

export function getTemplateRepository(): TemplateRepository {
  if (!templateRepository) {
    templateRepository = new TemplateRepository();
  }
  return templateRepository;
}
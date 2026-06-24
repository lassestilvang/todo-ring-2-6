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

  delete(id: string): void {
    this.db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
  }

  // Rating operations
  getRatings(templateId: string): TemplateRating[] {
    return this.db.prepare(
      'SELECT * FROM template_ratings WHERE template_id = ? ORDER BY created_at DESC'
    ).all(templateId) as TemplateRating[];
  }

  rateTemplate(templateId: string, rating: number): TemplateRating {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO template_ratings (id, template_id, rating, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, templateId, rating, now);

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
}

let templateRepository: TemplateRepository | null = null;

export function getTemplateRepository(): TemplateRepository {
  if (!templateRepository) {
    templateRepository = new TemplateRepository();
  }
  return templateRepository;
}
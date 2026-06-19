import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  estimateHours: number;
  estimateMinutes: number;
  isAllDay: boolean;
  recurringType: string;
  labelIds: string[];
  category: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isPublic?: boolean;
  downloadCount?: number;
  avgRating?: number;
}

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPublic = searchParams.get('public');
    const myTemplates = searchParams.get('myTemplates');
    const sortBy = searchParams.get('sortBy') || 'download_count';
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDb();
    let query = `
      SELECT t.*,
             COALESCE(AVG(r.rating), 0) as avgRating,
             COUNT(r.id) as ratingCount
      FROM task_templates t
      LEFT JOIN template_ratings r ON t.id = r.template_id
    `;
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    // Marketplace: only show public templates
    if (isPublic === 'true') {
      conditions.push('t.is_public = 1');
    }

    // My templates: filter by created_by
    if (myTemplates) {
      conditions.push('t.created_by = ?');
      values.push(myTemplates);
    }

    if (category) {
      conditions.push('t.category = ?');
      values.push(category);
    }

    if (search) {
      conditions.push('(t.name LIKE ? OR t.title LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY t.id ORDER BY ${sortBy} DESC LIMIT ?`;
    values.push(limit);

    const templates = db.prepare(query).all(...values) as TaskTemplate[];

    return jsonSuccess(templates);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const template: TaskTemplate = {
      id,
      name: body.name,
      icon: body.icon || '📋',
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'none',
      estimateHours: body.estimateHours || 0,
      estimateMinutes: body.estimateMinutes || 0,
      isAllDay: body.isAllDay || false,
      recurringType: body.recurringType || 'none',
      labelIds: body.labelIds || [],
      category: body.category || 'general',
      createdBy: body.createdBy,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isPublic: body.isPublic || false,
      downloadCount: 0,
    };

    db.prepare(`
      INSERT INTO task_templates (id, name, icon, title, description, priority, estimate_hours, estimate_minutes, is_all_day, recurring_type, label_ids, category, created_by, created_at, updated_at, usage_count, is_public, download_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.id,
      template.name,
      template.icon,
      template.title,
      template.description,
      template.priority,
      template.estimateHours,
      template.estimateMinutes,
      template.isAllDay ? 1 : 0,
      template.recurringType,
      JSON.stringify(template.labelIds),
      template.category,
      template.createdBy,
      template.createdAt,
      template.updatedAt,
      template.usageCount,
      template.isPublic,
      template.downloadCount
    );

    return jsonSuccess(template, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create template';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const db = getDb();
    const now = new Date().toISOString();

    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

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

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE task_templates SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TaskTemplate;

    // Update usage count
    db.prepare('UPDATE task_templates SET usage_count = usage_count + 1 WHERE id = ?').run(id);

    return jsonSuccess(template);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update template';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }

    const db = getDb();
    db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete template';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}
import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { SavedViewSchema } from '@/lib/validations';

ensureDbInitialized();

interface SavedView {
  id: string;
  name: string;
  icon: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const views = db.prepare(
      'SELECT * FROM saved_views ORDER BY created_at DESC'
    ).all() as SavedView[];
    return jsonSuccess(views);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch saved views';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = SavedViewSchema.safeParse(body);

    if (!validated.success) {
      return jsonError('Invalid saved view data', 400, 'VALIDATION_ERROR');
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO saved_views (id, name, icon, filters, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, validated.data.name, validated.data.icon, JSON.stringify(validated.data.filters), now, now);

    const view = db.prepare('SELECT * FROM saved_views WHERE id = ?').get(id) as SavedView;
    return jsonSuccess(view, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create saved view';
    return jsonError(message, 500, 'CREATE_ERROR');
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
    db.prepare('DELETE FROM saved_views WHERE id = ?').run(id);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete saved view';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}
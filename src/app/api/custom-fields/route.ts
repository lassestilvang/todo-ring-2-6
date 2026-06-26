import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { z } from 'zod';

ensureDbInitialized();

const CustomFieldSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  fieldKey: z.string().min(1).max(50),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea']),
  fieldValue: z.string().optional(),
  label: z.string().min(1).max(100),
  createdAt: z.string().datetime().optional(),
});

// Use dynamic import for db operations
async function getDb() {
  const { getDb: getDbClient } = await import('@/db/db-client');
  return getDbClient();
}

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return jsonError('taskId is required', 400, 'MISSING_TASK_ID');
    }

    const db = await getDb();
    const fields = db.prepare(
      'SELECT * FROM custom_fields WHERE task_id = ? ORDER BY field_key'
    ).all(taskId);

    return jsonSuccess(fields);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch custom fields';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = CustomFieldSchema.safeParse(body);

    if (!validated.success) {
      return jsonError(
        validated.error.errors.map(e => e.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }

    const { taskId, fieldKey, fieldType, fieldValue, label } = validated.data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const db = await getDb();
    db.prepare(
      'INSERT INTO custom_fields (id, task_id, field_key, field_type, field_value, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, taskId, fieldKey, fieldType, fieldValue || '', label, now);

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    return jsonSuccess(field, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create custom field';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { id, fieldValue } = body;

    if (!id) {
      return jsonError('Field ID is required', 400, 'MISSING_ID');
    }

    const db = await getDb();
    db.prepare(
      'UPDATE custom_fields SET field_value = ?, updated_at = ? WHERE id = ?'
    ).run(fieldValue, new Date().toISOString(), id);

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    return jsonSuccess(field);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update custom field';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Field ID is required', 400, 'MISSING_ID');
    }

    const db = await getDb();
    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete custom field';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

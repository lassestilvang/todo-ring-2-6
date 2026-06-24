import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { TimeEntrySchema } from '@/lib/validations';
import { ErrorCodes } from '@/lib/error-codes';
import type { TimeEntry } from '@/types/index';

ensureDbInitialized();

// GET /api/time-entries?taskId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return jsonError('Task ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const db = getDb();
    const entries = db.prepare(
      'SELECT * FROM time_entries WHERE task_id = ? ORDER BY created_at DESC'
    ).all(taskId) as TimeEntry[];

    return jsonSuccess(entries);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch time entries';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// POST /api/time-entries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = TimeEntrySchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO time_entries (id, task_id, start_time, end_time, duration, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      validated.data.taskId,
      validated.data.startTime,
      validated.data.endTime,
      validated.data.duration,
      validated.data.description || '',
      now,
      now
    );

    const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntry;
    return jsonSuccess(entry, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create time entry';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// DELETE /api/time-entries?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const db = getDb();
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);

    return jsonSuccess({ success: true }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete time entry';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
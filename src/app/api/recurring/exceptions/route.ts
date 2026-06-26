import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

interface RecurringException {
  id: string;
  taskId: string;
  exceptionDate: string;
  reason?: string;
  createdAt: string;
}

// Get exceptions for a task
export async function GET(_req: NextRequest) {
  const { searchParams } = new URL(_req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return jsonError('taskId is required', 400, 'MISSING_TASK_ID');
  }

  const db = require('@/db/operations').getDb();
  const exceptions = db.prepare(
    'SELECT * FROM recurring_exceptions WHERE task_id = ? ORDER BY exception_date DESC'
  ).all(taskId) as RecurringException[];

  return jsonSuccess(exceptions);
}

// Add an exception
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { taskId, exceptionDate, reason } = body;

    if (!taskId || !exceptionDate) {
      return jsonError('taskId and exceptionDate are required', 400, 'MISSING_FIELDS');
    }

    const db = require('@/db/operations').getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO recurring_exceptions (id, task_id, exception_date, reason, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, taskId, exceptionDate, reason || null, now);

    const exception = db.prepare(
      'SELECT * FROM recurring_exceptions WHERE id = ?'
    ).get(id) as RecurringException;

    return jsonSuccess(exception, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add exception';
    return jsonError(message, 500, 'EXCEPTION_ERROR');
  }
}

// Remove an exception
export async function DELETE(_req: NextRequest) {
  const { searchParams } = new URL(_req.url);
  const id = searchParams.get('id');

  if (!id) {
    return jsonError('id is required', 400, 'MISSING_ID');
  }

  const db = require('@/db/operations').getDb();
  db.prepare('DELETE FROM recurring_exceptions WHERE id = ?').run(id);

  return jsonSuccess({ deleted: true });
}
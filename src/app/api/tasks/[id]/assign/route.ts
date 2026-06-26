import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getUserById } from '@/db/operations';

ensureDbInitialized();

/**
 * Assign a task to a user
 * PUT /api/tasks/[id]/assign
 */
export async function PUT(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await _req.json();
    const { assigneeId, assigneeName } = body;

    if (!id) {
      return jsonError('Task ID is required', 400, 'MISSING_ID');
    }

    const db = getDb();

    // If assigning to a user, verify user exists
    if (assigneeId) {
      const user = getUserById(assigneeId);
      if (!user) {
        return jsonError('Assignee not found', 404, 'USER_NOT_FOUND');
      }
    }

    const stmt = db.prepare(
      'UPDATE tasks SET assignee_id = ?, assignee_name = ?, updated_at = ? WHERE id = ?'
    );
    const result = stmt.run(
      assigneeId || null,
      assigneeName || null,
      new Date().toISOString(),
      id
    );

    if (result.changes === 0) {
      return jsonError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Get updated task
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;

    return jsonSuccess(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to assign task';
    return jsonError(message, 500, 'ASSIGN_ERROR');
  }
}

/**
 * Unassign a task
 * DELETE /api/tasks/[id]/assign
 */
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return jsonError('Task ID is required', 400, 'MISSING_ID');
    }

    const db = getDb();

    const stmt = db.prepare(
      'UPDATE tasks SET assignee_id = NULL, assignee_name = NULL, updated_at = ? WHERE id = ?'
    );
    const result = stmt.run(new Date().toISOString(), id);

    if (result.changes === 0) {
      return jsonError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;

    return jsonSuccess(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to unassign task';
    return jsonError(message, 500, 'UNASSIGN_ERROR');
  }
}
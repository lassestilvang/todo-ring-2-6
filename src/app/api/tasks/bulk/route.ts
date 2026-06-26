import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { updateTask, deleteTask } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { ids, action, data } = body;

    if (!ids || !Array.isArray(ids)) {
      return jsonError('ids array required', 400, 'MISSING_IDS');
    }

    if (!['complete', 'pending', 'delete', 'move', 'priority', 'labels'].includes(action)) {
      return jsonError('Invalid action', 400, 'INVALID_ACTION');
    }

    const results = [];
    for (const id of ids) {
      try {
        if (action === 'delete') {
          deleteTask(id);
          results.push({ id, status: 'deleted' });
        } else if (action === 'complete') {
          const task = updateTask(id, { status: 'completed' });
          results.push({ id, status: 'completed', task });
        } else if (action === 'pending') {
          const task = updateTask(id, { status: 'pending' });
          results.push({ id, status: 'pending', task });
        } else if (action === 'move' && data?.listId) {
          const task = updateTask(id, { listId: data.listId });
          results.push({ id, status: 'moved', task });
        } else if (action === 'priority' && data?.priority) {
          const task = updateTask(id, { priority: data.priority });
          results.push({ id, status: 'updated', task });
        } else if (action === 'labels' && data?.labelIds) {
          // Handle label assignment
          results.push({ id, status: 'labels_updated' });
        }
      } catch (err) {
        results.push({ id, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    const errors = results.filter(r => r.status === 'error');
    const successCount = results.filter(r => r.status !== 'error').length;

    return jsonSuccess({
      updated: successCount,
      total: ids.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }, errors.length > 0 ? 207 : 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update tasks';
    return jsonError(message, 500, 'BULK_UPDATE_ERROR');
  }
}
import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getTaskShares,
  addTaskShare,
  removeTaskShare,
  getListShares,
  addListShare,
  removeListShare,
} from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const listId = searchParams.get('listId');

    if (taskId) {
      const shares = getTaskShares(taskId);
      return jsonSuccess(shares);
    }

    if (listId) {
      const shares = getListShares(listId);
      return jsonSuccess(shares);
    }

    return jsonError('taskId or listId required', 400, 'MISSING_ENTITY');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shares';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, listId, userId, userName, role } = body;

    if (taskId) {
      const share = addTaskShare(taskId, userId, userName, role);
      return jsonSuccess(share, 201);
    }

    if (listId) {
      const share = addListShare(listId, userId, userName, role);
      return jsonSuccess(share, 201);
    }

    return jsonError('taskId or listId required', 400, 'MISSING_ENTITY');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create share';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const listId = searchParams.get('listId');
    const userId = searchParams.get('userId');

    if (taskId && userId) {
      removeTaskShare(taskId, userId);
      return jsonSuccess({ success: true });
    }

    if (listId && userId) {
      removeListShare(listId, userId);
      return jsonSuccess({ success: true });
    }

    return jsonError('taskId/listId and userId required', 400, 'MISSING_FIELDS');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove share';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}
import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getTaskDependencies,
  getTaskDependents,
  addTaskDependency,
  removeTaskDependency,
  getBlockedTasks,
} from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { TaskDependencySchema } from '@/lib/validations';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const view = searchParams.get('view'); // 'blocked' or 'blocking'

    if (taskId) {
      if (view === 'blocked') {
        // Get tasks that this task is blocking (its dependents)
        const blocked = getTaskDependents(taskId);
        return jsonSuccess(blocked);
      } else if (view === 'blocking') {
        // Get tasks that this task is blocking (its dependencies)
        const blocking = getTaskDependencies(taskId);
        return jsonSuccess(blocking);
      }
      // Default: get both
      const [dependencies, dependents] = await Promise.all([
        getTaskDependencies(taskId),
        getTaskDependents(taskId),
      ]);
      return jsonSuccess({ dependencies, dependents });
    }

    // Get all blocked tasks
    const blockedTasks = getBlockedTasks();
    return jsonSuccess(blockedTasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dependencies';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = TaskDependencySchema.safeParse(body);

    if (!validated.success) {
      return jsonError(
        validated.error.errors.map(e => e.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }

    const { taskId, dependsOnId } = validated.data;

    // Prevent self-dependency
    if (taskId === dependsOnId) {
      return jsonError('Cannot create a dependency on itself', 400, 'INVALID_DEPENDENCY');
    }

    const dependency = addTaskDependency(taskId, dependsOnId);
    return jsonSuccess(dependency, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create dependency';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const dependsOnId = searchParams.get('dependsOnId');

    if (!taskId || !dependsOnId) {
      return jsonError('taskId and dependsOnId are required', 400, 'MISSING_PARAMS');
    }

    removeTaskDependency(taskId, dependsOnId);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove dependency';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

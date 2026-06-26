import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTaskRepository } from '@/lib/repositories/task-repository';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { TaskSchema } from '@/lib/validations';

ensureDbInitialized();

const taskRepo = getTaskRepository();

/**
 * GET /api/tasks/[id] - Get a single task by ID
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return jsonError('Task ID is required', 400, 'MISSING_ID');
    }

    const task = taskRepo.findById(id);

    if (!task) {
      return jsonError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    return jsonSuccess(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch task';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

/**
 * PUT /api/tasks/[id] - Update a task
 */
export async function PUT(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await _req.json();

    if (!id) {
      return jsonError('Task ID is required', 400, 'MISSING_ID');
    }

    const validated = TaskSchema.partial().safeParse({ id, ...body });
    if (!validated.success) {
      return jsonError('Invalid task data', 400, 'VALIDATION_ERROR');
    }

    const updatedTask = taskRepo.update(id, validated.data);

    return jsonSuccess(updatedTask);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

/**
 * DELETE /api/tasks/[id] - Delete a task
 */
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return jsonError('Task ID is required', 400, 'MISSING_ID');
    }

    taskRepo.delete(id);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}
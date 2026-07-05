/**
 * API v1 Tasks Route
 * Uses repository pattern and proper middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError, jsonPaginated } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { TaskSchema, BulkDeleteSchema, TaskReorderSchema } from '@/lib/validations';
import { getTaskRepository } from '@/lib/repositories';
import { getFromCache, setInCache } from '@/lib/server-cache';
import { parseSearchQuery } from '@/lib/nlp';
import type { Task } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

/**
 * GET /api/v1/tasks
 * Supports: view, listId, labelId, date, search, filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const listId = searchParams.get('listId');
    const labelId = searchParams.get('labelId');
    const date = searchParams.get('date');
    const search = searchParams.get('search');
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Filter parameters
    const priorities = searchParams.get('priorities')?.split(',').filter(Boolean) as ('high' | 'medium' | 'low' | 'none')[] | undefined;
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) as ('pending' | 'in_progress' | 'completed' | 'cancelled')[] | undefined;
    const labelFilterIds = searchParams.get('labels')?.split(',').filter(Boolean);

    const taskRepo = getTaskRepository();
    let tasks: Task[] = [];

    if (search) {
      const parsedQuery = parseSearchQuery(search);
      tasks = taskRepo.search(parsedQuery.raw) as Task[];
    } else if (view === 'today') {
      const cacheKey = `tasks:v1:view:today`;
      tasks = await getFromCache<Task[]>(cacheKey) || taskRepo.getTasksForToday();
      if (!await getFromCache(cacheKey)) {
        await setInCache(cacheKey, tasks, { ttlSeconds: 30 });
      }
    } else if (view === 'upcoming') {
      const cacheKey = `tasks:v1:view:upcoming`;
      tasks = await getFromCache<Task[]>(cacheKey) || taskRepo.getUpcomingTasks();
      if (!await getFromCache(cacheKey)) {
        await setInCache(cacheKey, tasks, { ttlSeconds: 60 });
      }
    } else if (listId) {
      tasks = taskRepo.findByList(listId, date || undefined);
    } else if (date) {
      tasks = taskRepo.getByDate(date);
    } else {
      tasks = taskRepo.findAll();
    }

    // Apply filters
    if (priorities?.length) {
      tasks = tasks.filter(t => priorities.includes(t.priority));
    }
    if (statuses?.length) {
      tasks = tasks.filter(t => statuses.includes(t.status));
    }

    // Pagination
    const { tasks: paginatedTasks, nextCursor } = paginateTasks(tasks, limit, cursor);
    return NextResponse.json({
      success: true,
      data: paginatedTasks,
      meta: { cursor: nextCursor, hasMore: !!nextCursor }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * POST /api/v1/tasks
 * Create task or reorder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const taskRepo = getTaskRepository();

    // Handle reorder
    if (body.taskId && body.newPosition !== undefined) {
      const validated = TaskReorderSchema.safeParse(body);
      if (!validated.success) {
        return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
      }
      taskRepo.updateSortOrder(validated.data.taskId, validated.data.newPosition);
      return jsonSuccess({ success: true });
    }

    // Handle create
    const validated = TaskSchema.safeParse(body);
    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const newTask = taskRepo.create(validated.data);
    return jsonSuccess(newTask, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * PUT /api/v1/tasks
 * Update a task
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('Task ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const validated = TaskSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const taskRepo = getTaskRepository();
    const updatedTask = taskRepo.update(id, validated.data);
    return jsonSuccess(updatedTask);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * DELETE /api/v1/tasks?id=xxx
 * Delete a task
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const taskRepo = getTaskRepository();
    taskRepo.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * PATCH /api/v1/tasks
 * Bulk delete tasks
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = BulkDeleteSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const taskRepo = getTaskRepository();
    for (const id of validated.data.ids) {
      taskRepo.delete(id);
    }

    return jsonSuccess({ deleted: validated.data.ids.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete tasks';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// Helper function for pagination
function paginateTasks(
  tasks: Task[],
  limit: number,
  cursor?: string
): { tasks: Task[]; nextCursor?: string } {
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = tasks.findIndex(t => t.id === cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const paginated = tasks.slice(startIndex, startIndex + limit);
  const nextCursor = paginated.length === limit ? paginated[paginated.length - 1]?.id : undefined;

  return { tasks: paginated, nextCursor };
}
import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  createTask,
  getTasks,
  getTasksByLabel,
  getAllTasks,
  getInboxTasks,
  getTasksForToday,
  getTasksForNext7Days,
  getUpcomingTasks,
  updateTask,
  deleteTask,
  searchTasks,
  updateTaskSortOrder,
} from '@/db/operations';
import { TaskSchema, BulkDeleteSchema, TaskReorderSchema } from '@/lib/validations';
import { jsonSuccess, jsonError, jsonValidationError, jsonPaginated } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { parseSearchQuery } from '@/lib/nlp';
import { getFromCache, setInCache } from '@/lib/server-cache';
import type { Task } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const view = searchParams.get('view');
    const listId = searchParams.get('listId');
    const labelId = searchParams.get('labelId');
    const date = searchParams.get('date');
    const search = searchParams.get('search');
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Filter parameters with proper typing
    const priorityParam = searchParams.get('priorities')?.split(',').filter(Boolean) as ('high' | 'medium' | 'low' | 'none')[] | undefined;
    const statusParam = searchParams.get('statuses')?.split(',').filter(Boolean) as ('pending' | 'in_progress' | 'completed' | 'cancelled')[] | undefined;
    const labelFilterIds = searchParams.get('labels')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minEstimate = searchParams.get('minEstimate');
    const maxEstimate = searchParams.get('maxEstimate');

    const filters = {
      priorities: priorityParam,
      statuses: statusParam,
      labelFilterIds,
      dateFrom,
      dateTo,
      minEstimate,
      maxEstimate,
    };

    if (search) {
      // Parse advanced search query
      const parsedQuery = parseSearchQuery(search);

      // Start with base search results
      let tasks = searchTasks(parsedQuery.raw) as Task[];

      // Apply additional filters from the parsed query
      if (parsedQuery.filters.priority) {
        tasks = tasks.filter(t => t.priority === parsedQuery.filters.priority);
      }
      if (parsedQuery.filters.status) {
        tasks = tasks.filter(t => t.status === parsedQuery.filters.status);
      }

      // Apply excludes
      if (parsedQuery.excludes.length > 0) {
        tasks = tasks.filter(t =>
          !parsedQuery.excludes.some(exclude =>
            t.title.toLowerCase().includes(exclude) ||
            (t.description && t.description.toLowerCase().includes(exclude))
          )
        );
      }

      // Apply phrase matches (must contain all phrases)
      if (parsedQuery.phrases.length > 0) {
        tasks = tasks.filter(t =>
          parsedQuery.phrases.every(phrase =>
            t.title.toLowerCase().includes(phrase.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(phrase.toLowerCase()))
          )
        );
      }

      return jsonSuccess(tasks);
    }

    if (view === 'today') {
      const cacheKey = `tasks:view:today:${JSON.stringify(filters)}`;
      let tasks = await getFromCache<Task[]>(cacheKey);
      if (!tasks) {
        tasks = getTasksForToday() as Task[];
        tasks = applyFilters(tasks, filters);
        await setInCache(cacheKey, tasks, { ttlSeconds: 30 });
      }
      return jsonSuccess(tasks);
    }

    if (view === 'next7') {
      const cacheKey = `tasks:view:next7:${JSON.stringify(filters)}`;
      let tasks = await getFromCache<Task[]>(cacheKey);
      if (!tasks) {
        tasks = getTasksForNext7Days() as Task[];
        tasks = applyFilters(tasks, filters);
        await setInCache(cacheKey, tasks, { ttlSeconds: 60 });
      }
      return jsonSuccess(tasks);
    }

    if (view === 'upcoming') {
      const cacheKey = `tasks:view:upcoming:${JSON.stringify(filters)}`;
      let tasks = await getFromCache<Task[]>(cacheKey);
      if (!tasks) {
        tasks = getUpcomingTasks() as Task[];
        tasks = applyFilters(tasks, filters);
        await setInCache(cacheKey, tasks, { ttlSeconds: 60 });
      }
      return jsonSuccess(tasks);
    }

    if (view === 'all') {
      const tasks = getAllTasks() as Task[];
      return jsonSuccess(applyFilters(tasks, filters));
    }

    if (labelId) {
      const tasks = getTasksByLabel(labelId) as Task[];
      return jsonSuccess(applyFilters(tasks, filters));
    }

    if (listId) {
      const tasks = getTasks(listId, date || undefined) as Task[];
      return jsonSuccess(applyFilters(tasks, filters));
    }

    if (date) {
      const tasks = getTasks(undefined, date) as Task[];
      return jsonSuccess(applyFilters(tasks, filters));
    }

    // Default: return paginated inbox tasks
    const allTasks = getInboxTasks();
    const { tasks, nextCursor } = paginateTasks(allTasks, limit, cursor);
    return jsonPaginated(tasks, {
      limit,
      cursor: nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Paginate tasks based on cursor and limit
 */
function paginateTasks(tasks: Task[], limit: number, cursor?: string): { tasks: Task[]; nextCursor?: string } {
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = tasks.findIndex(t => t.id === cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const paginated = tasks.slice(startIndex, startIndex + limit);
  const nextCursor = paginated.length === limit ? paginated[paginated.length - 1]?.id : undefined;

  return { tasks: paginated, nextCursor };
}

// Helper function to apply filters to task array
function applyFilters(
  tasks: Task[],
  filters: {
    priorities?: ('high' | 'medium' | 'low' | 'none')[];
    statuses?: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
    labelFilterIds?: string[];
    dateFrom?: string | null;
    dateTo?: string | null;
    minEstimate?: string | null;
    maxEstimate?: string | null;
  }
): Task[] {
  let result: Task[] = tasks;

  if (filters.priorities && filters.priorities.length > 0) {
    result = result.filter((t) => filters.priorities!.includes(t.priority));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    result = result.filter((t) => filters.statuses!.includes(t.status));
  }

  if (filters.labelFilterIds && filters.labelFilterIds.length > 0) {
    // Filter tasks that have ALL specified labels
    result = result.filter((t) => {
      if (!t.labels || t.labels.length === 0) return false;
      return filters.labelFilterIds!.every(labelId => t.labels!.includes(labelId));
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    result = result.filter((t) => {
      if (t.date) {
        if (filters.dateFrom && t.date < filters.dateFrom) return false;
        if (filters.dateTo && t.date > filters.dateTo) return false;
      }
      return true;
    });
  }

  if (filters.minEstimate || filters.maxEstimate) {
    result = result.filter((t) => {
      const totalMinutes = (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
      const totalHours = totalMinutes / 60;
      if (filters.minEstimate && totalHours < parseFloat(filters.minEstimate)) return false;
      if (filters.maxEstimate && totalHours > parseFloat(filters.maxEstimate)) return false;
      return true;
    });
  }

  return result;
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();

    // Handle reorder request
    if (body.taskId && body.newPosition !== undefined) {
      const validated = TaskReorderSchema.safeParse(body);
      if (!validated.success) {
        return jsonValidationError(
          validated.error.errors.map(e => ({ path: e.path, message: e.message }))
        );
      }
      updateTaskSortOrder(body.taskId, body.newPosition);
      return jsonSuccess({ success: true }, 200);
    }

    // Handle create request
    const validated = TaskSchema.safeParse(body);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }
    const newTask = createTask(validated.data);
    return jsonSuccess(newTask, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    const code = error instanceof Error && error.message.includes('not found')
      ? ErrorCodes.NOT_FOUND
      : ErrorCodes.INTERNAL_ERROR;
    return jsonError(message, 500, code);
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('Task ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const validated = TaskSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const updatedTask = updateTask(id, validated.data);
    return jsonSuccess(updatedTask);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    const code = error instanceof Error && error.message.includes('not found')
      ? ErrorCodes.NOT_FOUND
      : ErrorCodes.INTERNAL_ERROR;
    return jsonError(message, 500, code);
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');
    if (!id) {
      return jsonError('ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }
    deleteTask(id);
    return jsonSuccess({ success: true }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

export async function PATCH(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { ids } = body;

    const validated = BulkDeleteSchema.safeParse({ ids });
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    for (const id of validated.data.ids) {
      deleteTask(id);
    }

    return jsonSuccess({ deleted: validated.data.ids.length }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete tasks';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
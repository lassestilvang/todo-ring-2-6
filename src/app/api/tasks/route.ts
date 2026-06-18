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
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { parseSearchQuery } from '@/lib/nlp';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const listId = searchParams.get('listId');
    const labelId = searchParams.get('labelId');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    // Filter parameters
    const priorities = searchParams.get('priorities')?.split(',').filter(Boolean);
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean);
    const labelFilterIds = searchParams.get('labels')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minEstimate = searchParams.get('minEstimate');
    const maxEstimate = searchParams.get('maxEstimate');

    if (search) {
      // Parse advanced search query
      const parsedQuery = parseSearchQuery(search);

      // Start with base search results
      let tasks = searchTasks(parsedQuery.raw);

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
      const tasks = getTasksForToday();
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    if (view === 'next7') {
      const tasks = getTasksForNext7Days();
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    if (view === 'upcoming') {
      const tasks = getUpcomingTasks();
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    if (view === 'all') {
      const tasks = getAllTasks();
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    if (labelId) {
      const tasks = getTasksByLabel(labelId);
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    if (listId) {
      const tasks = getTasks(listId, date || undefined);
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    if (date) {
      const tasks = getTasks(undefined, date);
      return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
    }

    const tasks = getInboxTasks();
    return jsonSuccess(applyFilters(tasks, { priorities, statuses, labelFilterIds, dateFrom, dateTo, minEstimate, maxEstimate }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

// Helper function to apply filters to task array
function applyFilters(
  tasks: any[],
  filters: {
    priorities?: string[];
    statuses?: string[];
    labelFilterIds?: string[];
    dateFrom?: string | null;
    dateTo?: string | null;
    minEstimate?: string | null;
    maxEstimate?: string | null;
  }
) {
  let result = tasks;

  if (filters.priorities && filters.priorities.length > 0) {
    result = result.filter((t) => filters.priorities!.includes(t.priority));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    result = result.filter((t) => filters.statuses!.includes(t.status));
  }

  if (filters.labelFilterIds && filters.labelFilterIds.length > 0) {
    result = result.filter((t) => {
      if (!t.id) return false;
      // Check if task has any of the selected labels
      return filters.labelFilterIds!.some(labelId =>
        t._labels && t._labels.some((l: string) => l === labelId)
      );
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('Task ID is required', 400, 'MISSING_ID');
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
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }
    deleteTask(id);
    return jsonSuccess({ success: true }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
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
    return jsonError(message, 500, 'BULK_DELETE_ERROR');
  }
}
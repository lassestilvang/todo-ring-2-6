/**
 * API v2 Tasks Route
 * Enhanced version with additional features and improved response format
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { TaskSchema, BulkDeleteSchema, TaskReorderSchema } from '@/lib/validations';
import { getTaskRepository, getTaskDependencyRepository, getUserRepository } from '@/lib/repositories';
import { getFromCache, setInCache } from '@/lib/server-cache';
import { parseSearchQuery } from '@/lib/nlp';
import type { Task } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

// ============================================================================
// GET /api/v2/tasks
// Enhanced response with computed fields and relationships
// ============================================================================
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
    const includeDependencies = searchParams.get('includeDependencies') === 'true';
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    const taskRepo = getTaskRepository();
    let tasks: Task[] = [];

    if (search) {
      tasks = taskRepo.search(search);
    } else if (view === 'today') {
      tasks = taskRepo.getTodaysTasks();
    } else if (view === 'upcoming') {
      tasks = taskRepo.getUpcomingTasks();
    } else if (listId) {
      tasks = taskRepo.getByListId(listId);
    } else if (date) {
      tasks = taskRepo.getByDate(date);
    } else {
      tasks = taskRepo.findAll();
    }

    // Include dependency information for v2
    if (includeDependencies) {
      const depRepo = getTaskDependencyRepository();
      for (const task of tasks) {
        const blocking = depRepo.getByTaskId(task.id);
        task.dependencies = blocking;
      }
    }

    return jsonSuccess({
      tasks,
      meta: {
        count: tasks.length,
        view,
        hasComputedFields: includeAnalytics,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// ============================================================================
// POST /api/v2/tasks
// Enhanced with batch operations
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const taskRepo = getTaskRepository();

    // Handle batch create
    if (body.tasks && Array.isArray(body.tasks)) {
      const createdTasks = [];
      for (const taskData of body.tasks) {
        const validated = TaskSchema.safeParse(taskData);
        if (!validated.success) continue;
        createdTasks.push(taskRepo.create(validated.data));
      }
      return jsonSuccess(createdTasks, 201);
    }

    // Handle single create
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

// ============================================================================
// PUT /api/v2/tasks
// ============================================================================
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

// ============================================================================
// DELETE /api/v2/tasks
// ============================================================================
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
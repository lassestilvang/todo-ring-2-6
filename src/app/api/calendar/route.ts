import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, createTask, updateTask, getTaskById } from '@/db/operations';
import { parseICS, stringifyICS, getDateTime } from 'ics';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { jsonSuccess, jsonError, jsonValidationError, ErrorCodes } from '@/lib/api-response';

ensureDbInitialized();

// Validation schemas
const ICSImportSchema = z.object({
  content: z.string().min(1, 'ICS content is required'),
});

const TaskUpdateSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  updates: z.record(z.any()),
});

const TaskCreationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']).optional(),
  listId: z.string().optional(),
});

/**
 * GET /api/calendar
 * Get tasks for calendar view
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let tasks = getTasks();

    // Filter by date range
    if (startDate) {
      tasks = tasks.filter(t => t.date && t.date >= startDate);
    }
    if (endDate) {
      tasks = tasks.filter(t => t.date && t.date <= endDate);
    }

    // Group by date
    const grouped: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (task.date) {
        if (!grouped[task.date]) {
          grouped[task.date] = [];
        }
        grouped[task.date]!.push(task);
      }
    }

    return jsonSuccess({
      tasks,
      grouped,
      total: tasks.length,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to fetch calendar data',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * POST /api/calendar
 * Import tasks from ICS or create new task
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/ics')) {
      return await handleICSImport(request);
    }

    // Default: create new task
    return await handleTaskCreation(request);
  } catch (error) {
    console.error('Calendar POST error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to process request',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * PUT /api/calendar
 * Export to ICS or update task
 */
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/ics')) {
      return await handleICSExport(request);
    }

    return await handleTaskUpdate(request);
  } catch (error) {
    console.error('Calendar PUT error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update resource',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Import tasks from ICS file
 */
async function handleICSImport(request: NextRequest) {
  try {
    const body = await request.text();
    const validated = ICSImportSchema.safeParse({ content: body });

    if (!validated.success) {
      return jsonValidationError(validated.error.errors);
    }

    // Parse ICS content
    const parsed = parseICS(validated.data.content, {
      // Config options for ics library
    });

    if (!parsed) {
      return jsonError('Failed to parse ICS content', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const createdTasks = [];
    const existingTasks = getTasks();

    for (const event of parsed.events) {
      // Check for duplicates
      const exists = existingTasks.some(
        t => t.title === event.summary || t.id === event.uid
      );

      if (!exists) {
        const newTask = createTask({
          id: randomUUID(),
          title: event.summary || 'Untitled Task',
          description: event.description || '',
          date: getDateTime(event.start) || undefined,
          deadline: getDateTime(event.end) || undefined,
          priority: 'medium',
          listId: 'default',
        });
        createdTasks.push(newTask);
      }
    }

    return jsonSuccess({
      imported: createdTasks.length,
      tasks: createdTasks,
      message: `Successfully imported ${createdTasks.length} tasks from ICS`,
    });
  } catch (error) {
    return jsonError(
      `ICS import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      400,
      ErrorCodes.IMPORT_ERROR
    );
  }
}

/**
 * Create a new task from request body
 */
async function handleTaskCreation(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = TaskCreationSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors);
    }

    const newTask = createTask({
      id: randomUUID(),
      ...validated.data,
    });

    return jsonSuccess(newTask, 201);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create task',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Update an existing task
 */
async function handleTaskUpdate(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = TaskUpdateSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors);
    }

    const { taskId, updates } = validated.data;

    // Check if task exists
    const existingTask = getTaskById(taskId);
    if (!existingTask) {
      return jsonError('Task not found', 404, ErrorCodes.TASK_NOT_FOUND);
    }

    // Update task
    const updatedTask = updateTask(taskId, updates);

    return jsonSuccess({
      task: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update task',
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

/**
 * Export tasks to ICS format
 */
async function handleICSExport(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, format = 'ics' } = body;

    if (!tasks || !Array.isArray(tasks)) {
      return jsonError('Tasks array is required', 400, ErrorCodes.BAD_REQUEST);
    }

    const events = tasks.map((task: any) => ({
      summary: task.title,
      description: task.description || '',
      start: {
        date: task.date,
      },
      end: {
        date: task.deadline || task.date,
      },
      uid: task.id,
    }));

    const icsContent = stringifyICS({
      events,
    });

    if (!icsContent) {
      return jsonError('Failed to generate ICS', 500, ErrorCodes.EXPORT_ERROR);
    }

    return NextResponse.json(
      { success: true, ics: icsContent },
      {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="tasks.ics"',
        },
      }
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'ICS export failed',
      500,
      ErrorCodes.EXPORT_ERROR
    );
  }
}
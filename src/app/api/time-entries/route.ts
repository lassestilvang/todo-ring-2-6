import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTimeEntryRepository, getTaskRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { TimeEntrySchema } from '@/lib/validations';
import { ErrorCodes } from '@/lib/error-codes';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

ensureDbInitialized();
const timeEntryRepository = getTimeEntryRepository();
const taskRepository = getTaskRepository();

// GET /api/time-entries?taskId=xxx&period=30d|7d|week|month
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');
    const period = searchParams.get('period') as '7d' | '30d' | 'week' | 'month' | null;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // If period or date range is specified, return report data
    if (period || (from && to)) {
      let startDate: Date;
      let endDate: Date;

      if (from && to) {
        startDate = new Date(from);
        endDate = new Date(to);
      } else {
        const now = new Date();
        switch (period) {
          case '7d':
            startDate = subDays(now, 7);
            endDate = now;
            break;
          case 'week':
            startDate = startOfWeek(now);
            endDate = endOfWeek(now);
            break;
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          default:
            startDate = subDays(now, 30);
            endDate = now;
        }
      }

      const entries = timeEntryRepository.findInRange(startDate, endDate);
      const tasks = taskRepository.getAllTasks();
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      // Enrich entries with task titles
      const enrichedEntries = entries.map(entry => ({
        ...entry,
        taskTitle: taskMap.get(entry.taskId)?.title || 'Unknown Task',
      }));

      return jsonSuccess(enrichedEntries);
    }

    // Default: get entries by taskId
    if (!taskId) {
      return jsonError('Task ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const entries = timeEntryRepository.findByTask(taskId);
    return jsonSuccess(entries);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch time entries';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// POST /api/time-entries
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = TimeEntrySchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const entry = timeEntryRepository.create({
      taskId: validated.data.taskId,
      startTime: validated.data.startTime,
      endTime: validated.data.endTime,
      duration: validated.data.duration,
      description: validated.data.description,
    });
    return jsonSuccess(entry, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create time entry';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// DELETE /api/time-entries?id=xxx
export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    timeEntryRepository.delete(id);
    return jsonSuccess({ success: true }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete time entry';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
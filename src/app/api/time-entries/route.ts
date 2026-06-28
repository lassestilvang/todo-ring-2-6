import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTimeEntryRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { TimeEntrySchema } from '@/lib/validations';
import { ErrorCodes } from '@/lib/error-codes';

ensureDbInitialized();
const timeEntryRepository = getTimeEntryRepository();

// GET /api/time-entries?taskId=xxx
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');

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
import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getReminders,
  getUpcomingReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from '@/db/operations';
import { ReminderSchema } from '@/lib/validations';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { snoozeReminder as snoozeReminderFn } from '@/lib/notifications';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const upcoming = searchParams.get('upcoming') === 'true';

    if (upcoming) {
      const reminders = getUpcomingReminders(10);
      return jsonSuccess(reminders);
    }

    const reminders = taskId ? getReminders(taskId) : getReminders();
    return jsonSuccess(reminders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reminders';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ReminderSchema.safeParse(body);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }
    const reminder = createReminder(validated.data);
    return jsonSuccess(reminder, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create reminder';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }

    // Handle snooze separately
    if (data.snoozeMinutes !== undefined) {
      const result = await snoozeReminderFn(id, data.snoozeMinutes);
      if (!result.success) {
        return jsonError(result.error || 'Failed to snooze reminder', 400, 'SNOOZE_ERROR');
      }
      return jsonSuccess({ success: true });
    }

    const validated = ReminderSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const reminder = updateReminder(id, validated.data);
    return jsonSuccess(reminder);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update reminder';
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
    deleteReminder(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete reminder';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}
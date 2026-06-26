import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { processRecurringTasks, getRecurringTasks } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();

export async function GET() {
  try {
    const recurringTasks = getRecurringTasks();
    return jsonSuccess(recurringTasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recurring tasks';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { endDate } = body;

    const newlyCreated = processRecurringTasks(endDate);

    return jsonSuccess({
      count: newlyCreated.length,
      data: newlyCreated,
    }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process recurring tasks';
    return jsonError(message, 500, 'PROCESS_ERROR');
  }
}
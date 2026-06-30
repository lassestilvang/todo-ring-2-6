/**
 * Task Batches API Route (v2)
 * Manages groups of tasks with bulk operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBatches, getBatch, createBatch, updateBatch, deleteBatch, addTasksToBatch, removeTasksFromBatch, getBatchStats, createBatchWithTasks, exportBatch } from '@/services/task-batches-service';
import { withApiVersioning } from '@/lib/api-wrapper';
import { z } from 'zod';

const createBatchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
});

const updateBatchSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
});

export const GET = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id') || 'demo-user';
  const format = searchParams.get('format') as 'json' | 'csv' | 'markdown' | null;

  if (format && id) {
    // Export batch
    const data = exportBatch(id, userId, format);
    return new NextResponse(data, {
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/markdown',
        'Content-Disposition': `attachment; filename=batch.${format}`
      }
    });
  }

  if (id) {
    const batch = getBatch(id, userId);
    if (!batch) {
      return { success: false, error: 'Batch not found', code: 'NOT_FOUND' };
    }
    return { success: true, data: batch };
  }

  const batches = getBatches(userId);
  return { success: true, data: batches };
});

export const POST = withApiVersioning(async (req: NextRequest) => {
  const body = await req.json();
  const userId = req.headers.get('x-user-id') || 'demo-user';

  // Check if it's a batch creation with tasks
  if (body.tasks && Array.isArray(body.tasks)) {
    const { batch, tasks } = createBatchWithTasks(userId, body, body.tasks);
    return { success: true, data: { batch, tasks } };
  }

  // Regular batch creation
  const validated = createBatchSchema.safeParse(body);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors.map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR'
    };
  }

  const batch = createBatch(userId, validated.data);
  return { success: true, data: batch };
});

export const PUT = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!id) {
    return { success: false, error: 'ID is required', code: 'MISSING_ID' };
  }

  const body = await req.json();
  const validated = updateBatchSchema.safeParse(body);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors.map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR'
    };
  }

  const batch = updateBatch(id, userId, validated.data);
  if (!batch) {
    return { success: false, error: 'Batch not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: batch };
});

export const DELETE = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!id) {
    return { success: false, error: 'ID is required', code: 'MISSING_ID' };
  }

  const deleted = deleteBatch(id, userId);
  if (!deleted) {
    return { success: false, error: 'Batch not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: { message: 'Batch deleted' } };
});

// PATCH for adding/removing tasks
export const PATCH = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!id) {
    return { success: false, error: 'ID is required', code: 'MISSING_ID' };
  }

  const body = await req.json();
  const { action, taskIds } = body;

  if (!taskIds || !Array.isArray(taskIds)) {
    return { success: false, error: 'taskIds array is required', code: 'MISSING_TASK_IDS' };
  }

  let result;
  if (action === 'add') {
    result = addTasksToBatch(id, userId, taskIds);
  } else if (action === 'remove') {
    result = removeTasksFromBatch(id, userId, taskIds);
  } else {
    return { success: false, error: `Unknown action: ${action}`, code: 'INVALID_ACTION' };
  }

  if (!result) {
    return { success: false, error: 'Batch not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: result };
});
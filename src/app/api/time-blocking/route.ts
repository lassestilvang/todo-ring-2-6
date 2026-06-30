/**
 * Time Blocking API Route (v2)
 * Manages time blocks for scheduling tasks with versioning support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTimeBlock, getTimeBlocks, getTimeBlocksForDate, updateTimeBlock, deleteTimeBlock, checkConflicts, getAvailableSlots, scheduleTask } from '@/services/time-blocking-service';
import { withApiVersioning, addVersionHeaders } from '@/lib/api-wrapper';
import { z } from 'zod';

const createTimeBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  taskId: z.string().optional(),
});

const updateTimeBlockSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  startTime: z.string().datetime('Invalid start time').optional(),
  end_time: z.string().datetime('Invalid end time').optional(),
  taskId: z.string().optional(),
});

export const GET = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const date = searchParams.get('date');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  let timeBlocks: any[];

  if (date) {
    timeBlocks = getTimeBlocksForDate(userId, date);
  } else {
    timeBlocks = getTimeBlocks(userId);
  }

  return { success: true, data: timeBlocks };
});

export const POST = withApiVersioning(async (req: NextRequest) => {
  const body = await req.json();
  const userId = req.headers.get('x-user-id') || 'demo-user';

  const validated = createTimeBlockSchema.safeParse(body);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors.map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR'
    };
  }

  // Check for conflicts
  const conflicts = checkConflicts(userId, validated.data.startTime, validated.data.endTime);
  if (conflicts.length > 0) {
    return {
      success: false,
      error: 'Time slot conflicts with existing schedule',
      code: 'SCHEDULING_CONFLICT',
      data: conflicts
    };
  }

  const timeBlock = createTimeBlock(userId, validated.data);
  return { success: true, data: timeBlock };
});

export const PUT = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!id) {
    return { success: false, error: 'ID is required', code: 'MISSING_ID' };
  }

  const body = await req.json();
  const validated = updateTimeBlockSchema.safeParse(body);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors.map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR'
    };
  }

  const timeBlock = updateTimeBlock(id, userId, validated.data);
  if (!timeBlock) {
    return { success: false, error: 'Time block not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: timeBlock };
});

export const DELETE = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!id) {
    return { success: false, error: 'ID is required', code: 'MISSING_ID' };
  }

  const deleted = deleteTimeBlock(id, userId);
  if (!deleted) {
    return { success: false, error: 'Time block not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: { message: 'Time block deleted' } };
});
/**
 * Focus Sessions API Route (v2)
 * Manages Pomodoro sessions and focus time tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFocusSessions, getFocusStats, getTodayFocusMinutes, startFocusSession, completeFocusSession, cancelFocusSession, completePomodoro, recordBreak } from '@/services/focus-sessions-service';
import { withApiVersioning, addVersionHeaders } from '@/lib/api-wrapper';
import { z } from 'zod';

const createSessionSchema = z.object({
  taskId: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  isPomodoro: z.boolean().default(false)
});

export const GET = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const userId = req.headers.get('x-user-id') || 'demo-user';
  const date = searchParams.get('date') || undefined;
  const status = searchParams.get('status') as any;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

  // Stats endpoint
  if (searchParams.get('stats')) {
    const period = searchParams.get('period') as 'day' | 'week' | 'month' || 'week';
    const stats = getFocusStats(userId, period);
    const todayMinutes = getTodayFocusMinutes(userId);

    return {
      success: true,
      data: {
        ...stats,
        todayMinutes
      }
    };
  }

  const sessions = getFocusSessions(userId, { date, status, limit });
  return { success: true, data: sessions };
});

export const POST = withApiVersioning(async (req: NextRequest) => {
  const body = await req.json();
  const userId = req.headers.get('x-user-id') || 'demo-user';

  const validated = createSessionSchema.safeParse(body);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors.map(e => e.message).join(', '),
      code: 'VALIDATION_ERROR'
    };
  }

  const session = startFocusSession(userId, validated.data);
  return { success: true, data: session };
});

export const PATCH = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const action = searchParams.get('action');
  const userId = req.headers.get('x-user-id') || 'demo-user';

  if (!id || !action) {
    return { success: false, error: 'ID and action are required', code: 'MISSING_PARAMS' };
  }

  let result: any;
  switch (action) {
    case 'complete':
      result = completeFocusSession(id, userId);
      break;
    case 'cancel':
      result = cancelFocusSession(id, userId);
      break;
    case 'pomodoro':
      result = completePomodoro(id, userId);
      break;
    case 'break':
      result = recordBreak(id, userId);
      break;
    default:
      return { success: false, error: `Unknown action: ${action}`, code: 'INVALID_ACTION' };
  }

  if (!result) {
    return { success: false, error: 'Session not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: result };
});
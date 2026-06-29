import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getFocusSessionRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { FocusSessionSchema } from '@/lib/validations';

ensureDbInitialized();
const focusSessionRepository = getFocusSessionRepository();

// POST /api/focus-sessions - Start a focus session
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = FocusSessionSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const session = focusSessionRepository.create({
      userId: validated.data.userId,
      taskId: validated.data.taskId,
      duration: validated.data.duration,
      startedAt: new Date().toISOString(),
      status: 'active',
    });

    return jsonSuccess(session, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start focus session';
    return jsonError(message, 500, 'FOCUS_ERROR');
  }
}

// PUT /api/focus-sessions - Complete a focus session
export async function PUT(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { id, status } = body;

    if (!id) {
      return jsonError('Session ID is required', 400, 'MISSING_ID');
    }

    const session = focusSessionRepository.update(id, { status: status || 'completed' });
    return jsonSuccess(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete focus session';
    return jsonError(message, 500, 'FOCUS_ERROR');
  }
}

// GET /api/focus-sessions - Get focus sessions
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const sessions = focusSessionRepository.findAll(userId, limit);
    return jsonSuccess(sessions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
    return jsonError(message, 500, 'FOCUS_ERROR');
  }
}
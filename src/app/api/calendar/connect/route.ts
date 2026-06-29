import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { CalendarConnectionSchema } from '@/lib/validations';

ensureDbInitialized();

// POST /api/calendar/connect - Connect calendar account
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = CalendarConnectionSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { provider, accessToken, refreshToken, userId } = validated.data;
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO calendar_connections (id, user_id, provider, access_token, refresh_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, userId, provider, accessToken, refreshToken || null, now);

    return jsonSuccess({ id, provider }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to connect calendar';
    return jsonError(message, 500, 'CALENDAR_CONNECT_ERROR');
  }
}

// GET /api/calendar/connect - Get user's calendar connections
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const db = getDb();
    const connections = db.prepare(
      'SELECT id, provider, created_at FROM calendar_connections WHERE user_id = ?'
    ).all(userId) as any[];

    return jsonSuccess(connections);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch connections';
    return jsonError(message, 500, 'CALENDAR_FETCH_ERROR');
  }
}

// DELETE /api/calendar/connect - Disconnect calendar
export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Connection ID is required', 400, 'MISSING_ID');
    }

    const db = getDb();
    db.prepare('DELETE FROM calendar_connections WHERE id = ?').run(id);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect';
    return jsonError(message, 500, 'CALENDAR_DISCONNECT_ERROR');
  }
}
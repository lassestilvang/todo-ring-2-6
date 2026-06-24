import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { TeamSchema } from '@/lib/validations';
import { ErrorCodes } from '@/lib/error-codes';
import type { Team } from '@/types/index';

ensureDbInitialized();

// GET /api/teams
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const db = getDb();

    let teams: Team[];

    if (userId) {
      // Get teams for a specific user
      teams = db.prepare(
        `SELECT t.* FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = ?
         ORDER BY t.created_at DESC`
      ).all(userId) as Team[];
    } else {
      teams = db.prepare(
        'SELECT * FROM teams ORDER BY created_at DESC'
      ).all() as Team[];
    }

    return jsonSuccess(teams);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch teams';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// POST /api/teams
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = TeamSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO teams (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, validated.data.name, validated.data.description || '', now, now);

    const team: Team = {
      id,
      name: validated.data.name,
      description: validated.data.description || '',
      createdAt: now,
      updatedAt: now,
    };

    return jsonSuccess(team, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create team';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// PUT /api/teams
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('Team ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const validated = TeamSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (validated.data.name !== undefined) { updates.push('name = ?'); values.push(validated.data.name); }
    if (validated.data.description !== undefined) { updates.push('description = ?'); values.push(validated.data.description); }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as Team;
    return jsonSuccess(team);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update team';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// DELETE /api/teams
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Team ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const db = getDb();
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete team';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// PATCH /api/teams - Member management
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, userId, action } = body;

    if (!teamId || !userId || !action) {
      return jsonError('teamId, userId, and action are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const db = getDb();
    const now = new Date().toISOString();

    if (action === 'add') {
      const role = body.role || 'viewer';
      const memberId = crypto.randomUUID();

      db.prepare(
        'INSERT INTO team_members (id, team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)'
      ).run(memberId, teamId, userId, role, now);

      const member = db.prepare(
        `SELECT tm.*, u.name as user_name, u.email
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.id = ?`
      ).get(memberId);

      return jsonSuccess(member, 201);
    }

    if (action === 'remove') {
      db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
      return jsonSuccess({ success: true });
    }

    if (action === 'update-role') {
      const role = body.role;
      if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
        return jsonError('Valid role is required (viewer, editor, admin)', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      db.prepare('UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?').run(role, teamId, userId);

      const member = db.prepare(
        `SELECT tm.*, u.name as user_name, u.email
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = ? AND tm.user_id = ?`
      ).get(teamId, userId);

      return jsonSuccess(member);
    }

    return jsonError('Invalid action', 400, ErrorCodes.INVALID_REQUEST);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process team member request';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
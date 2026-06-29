import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

// GET /api/teams/[teamId]/members - Get team members
export async function GET(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const db = getDb();

    const members = db.prepare(`
      SELECT tm.id, tm.role, tm.joined_at,
             u.id as user_id, u.name, u.email, u.avatar
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.role DESC, tm.joined_at ASC
    `).all(teamId) as any[];

    return jsonSuccess(members);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch members';
    return jsonError(message, 500, 'MEMBERS_FETCH_ERROR');
  }
}

// POST /api/teams/[teamId]/members - Add member to team
export async function POST(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const body = await _req.json();
    const { userId, role } = body;

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const db = getDb();
    const now = new Date().toISOString();
    const memberId = crypto.randomUUID();

    // Check if user is already a member
    const existing = db.prepare(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
    ).get(teamId, userId);

    if (existing) {
      return jsonError('User is already a team member', 400, 'ALREADY_MEMBER');
    }

    db.prepare(
      'INSERT INTO team_members (id, team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)'
    ).run(memberId, teamId, userId, role || 'viewer', now);

    const member = db.prepare(`
      SELECT tm.id, tm.role, tm.joined_at,
             u.id as user_id, u.name, u.email, u.avatar
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.id = ?
    `).get(memberId);

    return jsonSuccess(member, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add member';
    return jsonError(message, 500, 'MEMBER_ADD_ERROR');
  }
}

// DELETE /api/teams/[teamId]/members - Remove member from team
export async function DELETE(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const db = getDb();
    db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    return jsonError(message, 500, 'MEMBER_REMOVE_ERROR');
  }
}
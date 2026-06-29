import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

// GET /api/teams/[teamId]/projects - Get team projects (lists)
export async function GET(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const db = getDb();

    const projects = db.prepare(`
      SELECT l.*, tp.role_required
      FROM team_projects tp
      JOIN lists l ON tp.list_id = l.id
      WHERE tp.team_id = ?
      ORDER BY l.created_at DESC
    `).all(teamId) as any[];

    return jsonSuccess(projects);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    return jsonError(message, 500, 'PROJECTS_FETCH_ERROR');
  }
}

// POST /api/teams/[teamId]/projects - Add project to team
export async function POST(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const body = await _req.json();
    const { listId, roleRequired } = body;

    if (!listId) {
      return jsonError('listId is required', 400, 'MISSING_LIST_ID');
    }

    const db = getDb();
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();

    // Check if project already exists
    const existing = db.prepare(
      'SELECT id FROM team_projects WHERE team_id = ? AND list_id = ?'
    ).get(teamId, listId);

    if (existing) {
      return jsonError('List is already a team project', 400, 'ALREADY_PROJECT');
    }

    db.prepare(
      'INSERT INTO team_projects (id, team_id, list_id, role_required, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(projectId, teamId, listId, roleRequired || 'viewer', now);

    const project = db.prepare(`
      SELECT p.*, l.name, l.color, l.emoji
      FROM team_projects p
      JOIN lists l ON p.list_id = l.id
      WHERE p.id = ?
    `).get(projectId);

    return jsonSuccess(project, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add project';
    return jsonError(message, 500, 'PROJECT_ADD_ERROR');
  }
}

// DELETE /api/teams/[teamId]/projects - Remove project from team
export async function DELETE(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const { searchParams } = new URL(_req.url);
    const listId = searchParams.get('listId');

    if (!listId) {
      return jsonError('listId is required', 400, 'MISSING_LIST_ID');
    }

    const db = getDb();
    db.prepare('DELETE FROM team_projects WHERE team_id = ? AND list_id = ?').run(teamId, listId);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove project';
    return jsonError(message, 500, 'PROJECT_REMOVE_ERROR');
  }
}
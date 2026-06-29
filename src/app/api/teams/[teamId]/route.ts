import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTeamRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();
const teamRepository = getTeamRepository();

// GET /api/teams/[teamId] - Get single team
export async function GET(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const team = teamRepository.findById(teamId);

    if (!team) {
      return jsonError('Team not found', 404, 'NOT_FOUND');
    }

    return jsonSuccess(team);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch team';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

// PUT /api/teams/[teamId] - Update team
export async function PUT(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    const body = await _req.json();

    const team = teamRepository.update(teamId, body);
    return jsonSuccess(team);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update team';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(_req: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await context.params;
    teamRepository.delete(teamId);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete team';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}
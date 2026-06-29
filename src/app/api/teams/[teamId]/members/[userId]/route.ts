import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTeamRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();
const teamRepository = getTeamRepository();

// PATCH /api/teams/[teamId]/members/[userId] - Update member role
export async function PATCH(_req: NextRequest, context: { params: Promise<{ teamId: string; userId: string }> }) {
  try {
    const { teamId, userId } = await context.params;
    const body = await _req.json();
    const { role } = body;

    if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
      return jsonError('Valid role is required (viewer, editor, admin)', 400, 'INVALID_ROLE');
    }

    teamRepository.updateMemberRole(teamId, userId, role);
    const member = teamRepository.getMember(teamId, userId);

    return jsonSuccess(member);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update member role';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}
import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTeamRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { TeamSchema } from '@/lib/validations';
import { ErrorCodes } from '@/lib/error-codes';

ensureDbInitialized();
const teamRepository = getTeamRepository();

// GET /api/teams
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');

    const teams = userId
      ? teamRepository.getTeamsForUser(userId)
      : teamRepository.findAll();

    return jsonSuccess(teams);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch teams';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// POST /api/teams
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = TeamSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const team = teamRepository.create({
      name: validated.data.name,
      description: validated.data.description,
    });

    return jsonSuccess(team, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create team';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// PUT /api/teams
export async function PUT(_req: NextRequest) {
  try {
    const body = await _req.json();
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

    const team = teamRepository.update(id, validated.data);
    return jsonSuccess(team);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update team';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// DELETE /api/teams
export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Team ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    teamRepository.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete team';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

// PATCH /api/teams - Member management
export async function PATCH(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { teamId, userId, action } = body;

    if (!teamId || !userId || !action) {
      return jsonError('teamId, userId, and action are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    if (action === 'add') {
      const role = body.role || 'viewer';
      teamRepository.addMember(teamId, userId, role);
      const memberWithUser = teamRepository.getMembers(teamId).find(m => m.userId === userId);
      return jsonSuccess(memberWithUser, 201);
    }

    if (action === 'remove') {
      teamRepository.removeMember(teamId, userId);
      return jsonSuccess({ success: true });
    }

    if (action === 'update-role') {
      const role = body.role;
      if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
        return jsonError('Valid role is required (viewer, editor, admin)', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
      }

      teamRepository.updateMemberRole(teamId, userId, role);
      const member = teamRepository.getMembers(teamId).find(m => m.userId === userId);
      return jsonSuccess(member);
    }

    return jsonError('Invalid action', 400, ErrorCodes.INVALID_REQUEST);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process team member request';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
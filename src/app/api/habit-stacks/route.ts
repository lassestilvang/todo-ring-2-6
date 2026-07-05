/**
 * Habit Stacking API
 * Manage habit chains for behavior chaining
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { getHabitStackRepository } from '@/lib/repositories/habit-stack-repository';

ensureDbInitialized();

/**
 * GET /api/habit-stacks
 * Get all habit stacks for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anchorTaskId = searchParams.get('anchorTaskId');
    const linkedTaskId = searchParams.get('linkedTaskId');

    const repo = getHabitStackRepository();

    // If specific anchor task requested, get its chain
    if (anchorTaskId) {
      const chain = repo.getChain(anchorTaskId);
      return jsonSuccess(chain);
    }

    // If specific linked task requested, get its dependencies
    if (linkedTaskId) {
      const stacks = repo.findByLinked(linkedTaskId);
      return jsonSuccess(stacks);
    }

    // Return empty for now (would need user-based filtering in full impl)
    return jsonSuccess([]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch habit stacks';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * POST /api/habit-stacks
 * Create a new habit stack
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anchorTaskId, linkedTaskId } = body;

    if (!anchorTaskId || !linkedTaskId) {
      return jsonError('anchorTaskId and linkedTaskId are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    if (anchorTaskId === linkedTaskId) {
      return jsonError('Cannot stack a habit with itself', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const repo = getHabitStackRepository();

    // Check if stack already exists
    const existing = repo.findOne(anchorTaskId, linkedTaskId);
    if (existing) {
      return jsonSuccess(existing);
    }

    // Check for circular dependency
    const chain = repo.getChain(linkedTaskId);
    const circular = chain.some(s => s.linkedTaskId === anchorTaskId);
    if (circular) {
      return jsonError('Circular dependency detected', 400, ErrorCodes.CIRCULAR_DEPENDENCY);
    }

    const stack = repo.create(anchorTaskId, linkedTaskId);
    return jsonSuccess(stack, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create habit stack';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * DELETE /api/habit-stacks?anchorTaskId=xxx&linkedTaskId=yyy
 * Delete a habit stack
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anchorTaskId = searchParams.get('anchorTaskId');
    const linkedTaskId = searchParams.get('linkedTaskId');

    if (!anchorTaskId || !linkedTaskId) {
      return jsonError('anchorTaskId and linkedTaskId are required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const repo = getHabitStackRepository();
    const deleted = repo.delete(anchorTaskId, linkedTaskId);

    if (!deleted) {
      return jsonError('Habit stack not found', 404, ErrorCodes.NOT_FOUND);
    }

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete habit stack';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
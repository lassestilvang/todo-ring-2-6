/**
 * API v1 Goals Route
 * Uses repository pattern
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { GoalSchema } from '@/lib/validations';
import { getGoalRepository } from '@/lib/repositories';
import type { Goal } from '@/types/index';

ensureDbInitialized();

export async function GET() {
  try {
    const goalRepo = getGoalRepository();
    const goals = goalRepo.findAll() as Goal[];
    return jsonSuccess(goals);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch goals';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GoalSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const goalRepo = getGoalRepository();
    const goal = goalRepo.create(validated.data);
    return jsonSuccess(goal, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create goal';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getAllGoals,
  getGoalsByPeriod,
  getGoalById,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  getActiveGoalsByPeriod,
  getGoalProgress,
} from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { GoalSchema } from '@/types/index';
import type { Goal } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    const userId = searchParams.get('userId') || 'current-user'; // In production, get from session

    if (period) {
      const goals = getGoalsByPeriod(period);
      return jsonSuccess(goals);
    }

    const goals = getAllGoals();
    return jsonSuccess(goals);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch goals';
    return jsonError(message, 500, 'GOALS_FETCH_ERROR');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = GoalSchema.omit({ id: true, userId: true, currentValue: true, isCompleted: true, createdAt: true, updatedAt: true }).parse(body);

    const goal = createGoal({
      userId: 'current-user', // In production, get from session
      title: validated.title,
      description: validated.description,
      targetValue: validated.targetValue,
      unit: validated.unit,
      period: validated.period,
      category: validated.category,
      color: validated.color,
      startDate: validated.startDate,
      endDate: validated.endDate,
    });

    return jsonSuccess(goal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create goal';
    return jsonError(message, 400, 'GOALS_CREATE_ERROR');
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Goal ID is required', 400, 'MISSING_ID');
    }

    const body = await request.json();
    const goal = updateGoal(id, body);

    return jsonSuccess(goal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update goal';
    return jsonError(message, 400, 'GOALS_UPDATE_ERROR');
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Goal ID is required', 400, 'MISSING_ID');
    }

    deleteGoal(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete goal';
    return jsonError(message, 500, 'GOALS_DELETE_ERROR');
  }
}
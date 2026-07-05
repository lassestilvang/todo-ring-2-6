/**
 * Focus Time Budgets API
 * Daily/weekly focus hours allocation with burnout prevention
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { getFocusTimeBudgets } from '@/lib/focus-time-budgets';

ensureDbInitialized();

/**
 * GET /api/focus-time-budgets
 * Get focus time budget and stats for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const period = searchParams.get('period') || 'daily';

    if (!userId) {
      return jsonError('User ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const budgets = getFocusTimeBudgets();

    // Get budget settings
    const budget = budgets.getBudget(userId);
    if (!budget) {
      return jsonSuccess({
        dailyLimit: 8,
        weeklyLimit: 40,
        workStartHour: 9,
        workEndHour: 17,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        burnoutWarningThreshold: 0.8
      });
    }

    if (period === 'weekly') {
      const weekStart = searchParams.get('weekStart') || new Date().toISOString().split('T')[0];
      const stats = budgets.getWeeklyStats(userId, weekStart);
      const risk = budgets.checkBurnoutRisk(userId);
      return jsonSuccess({ budget, stats, burnoutRisk: risk });
    }

    // Default: daily stats
    const stats = budgets.getDailyStats(userId, date);
    const risk = budgets.checkBurnoutRisk(userId);
    return jsonSuccess({ budget, stats, burnoutRisk: risk });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch focus time budgets';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * POST /api/focus-time-budgets
 * Create or update focus time budget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...budgetData } = body;

    if (!userId) {
      return jsonError('User ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const budgets = getFocusTimeBudgets();
    const budget = budgets.upsert(userId, budgetData);
    return jsonSuccess(budget, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update focus time budgets';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * DELETE /api/focus-time-budgets?userId=xxx
 * Delete focus time budget
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('User ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const budgets = getFocusTimeBudgets();
    const deleted = budgets.delete(userId);

    if (!deleted) {
      return jsonError('Focus time budget not found', 404, ErrorCodes.NOT_FOUND);
    }

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete focus time budgets';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
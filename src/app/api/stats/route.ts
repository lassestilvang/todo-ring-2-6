import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTaskStats, getOverdueCount, getCompletedTodayCount } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();

export async function GET() {
  try {
    const stats = getTaskStats();
    const overdueCount = getOverdueCount();
    const completedToday = getCompletedTodayCount();
    return jsonSuccess({ ...stats, overdueCount, completedToday });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    return jsonError(message, 500, 'STATS_ERROR');
  }
}
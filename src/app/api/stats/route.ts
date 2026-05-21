import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/db/index';
import { getTaskStats, getOverdueCount, getCompletedTodayCount } from '@/db/operations';

try {
  initDb();
} catch (e) {}

export async function GET() {
  try {
    const stats = getTaskStats();
    const overdueCount = getOverdueCount();
    const completedToday = getCompletedTodayCount();
    return NextResponse.json({
      success: true,
      data: { ...stats, overdueCount, completedToday },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
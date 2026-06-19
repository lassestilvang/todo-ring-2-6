import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks } from '@/db/operations';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all tasks and filter client-side for flexibility
    const tasks = getTasks();

    // Filter by date range if provided
    let filteredTasks = tasks;
    if (startDate) {
      filteredTasks = filteredTasks.filter(t => t.date && t.date >= startDate);
    }
    if (endDate) {
      filteredTasks = filteredTasks.filter(t => t.date && t.date <= endDate);
    }

    // Group by date for calendar view
    const grouped: Record<string, typeof tasks> = {};
    for (const task of filteredTasks) {
      if (task.date) {
        if (!grouped[task.date]) {
          grouped[task.date] = [];
        }
        const group = grouped[task.date];
        if (group) {
          group.push(task);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tasks: filteredTasks,
        grouped,
        total: filteredTasks.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
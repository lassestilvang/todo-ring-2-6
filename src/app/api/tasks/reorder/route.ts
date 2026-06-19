import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { updateTaskSortOrder } from '@/db/operations';

// Ensure database is initialized
ensureDbInitialized();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, newPosition } = body;

    if (!taskId || newPosition === undefined) {
      return NextResponse.json(
        { success: false, error: 'taskId and newPosition are required' },
        { status: 400 }
      );
    }

    const task = updateTaskSortOrder(taskId, newPosition);
    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reorder task' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTaskHistory } from '@/db/operations';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });
    }
    const history = getTaskHistory(taskId);
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch history' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getSubtasks,
  createSubtask,
  toggleSubtask as toggleSubtaskStatus,
  deleteSubtask,
} from '@/db/operations';
import { SubtaskSchema } from '@/lib/validations';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });
    }
    const subtasks = getSubtasks(taskId);
    return NextResponse.json({ success: true, data: subtasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch subtasks' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = SubtaskSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }
    const newSubtask = createSubtask(validated.data);
    return NextResponse.json({ success: true, data: newSubtask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create subtask' }, { status: 500 });
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    const updatedSubtask = toggleSubtaskStatus(id);
    return NextResponse.json({ success: true, data: updatedSubtask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update subtask' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    deleteSubtask(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete subtask' }, { status: 500 });
  }
}
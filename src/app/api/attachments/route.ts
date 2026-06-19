import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTaskAttachments, createAttachment, deleteAttachment, getTaskById } from '@/db/operations';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });
    }
    const attachments = getTaskAttachments(taskId);
    return NextResponse.json({ success: true, data: attachments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, filename, fileType, fileSize, filePath } = body;

    if (!taskId || !filename) {
      return NextResponse.json(
        { success: false, error: 'taskId and filename are required' },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const attachment = createAttachment({ taskId, filename, fileType, fileSize, filePath });
    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add attachment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    deleteAttachment(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete attachment' }, { status: 500 });
  }
}
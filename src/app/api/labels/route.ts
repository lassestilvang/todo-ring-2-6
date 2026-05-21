import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/db/index';
import { getAllLabels, createLabel, updateLabel as dbUpdateLabel, deleteLabel as dbDeleteLabel, getTaskLabels, addLabelToTask, removeLabelFromTask } from '@/db/operations';

try {
  initDb();
} catch (e) {}

export async function GET() {
  try {
    const labels = getAllLabels();
    return NextResponse.json({ success: true, data: labels });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch labels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'assign') {
      addLabelToTask(body.taskId, body.labelId);
      const labels = getTaskLabels(body.taskId);
      return NextResponse.json({ success: true, data: labels });
    }

    if (body.action === 'remove') {
      removeLabelFromTask(body.taskId, body.labelId);
      const labels = getTaskLabels(body.taskId);
      return NextResponse.json({ success: true, data: labels });
    }

    const newLabel = createLabel(body);
    return NextResponse.json({ success: true, data: newLabel }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create label' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updatedLabel = dbUpdateLabel(id, data);
    return NextResponse.json({ success: true, data: updatedLabel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update label' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    dbDeleteLabel(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete label' }, { status: 500 });
  }
}
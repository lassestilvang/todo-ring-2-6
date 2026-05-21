import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/db/index';
import {
  createTask,
  getTaskById,
  getTasks,
  getAllTasks,
  getInboxTasks,
  getTasksForToday,
  getTasksForNext7Days,
  getUpcomingTasks,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  searchTasks,
  getTaskStats,
  getOverdueCount,
  getCompletedTodayCount,
} from '@/db/operations';

// Ensure database is initialized
try {
  initDb();
} catch (e) {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const listId = searchParams.get('listId');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    if (search) {
      const tasks = searchTasks(search);
      return NextResponse.json({ success: true, data: tasks });
    }

    if (view === 'today') {
      const tasks = getTasksForToday();
      return NextResponse.json({ success: true, data: tasks });
    }

    if (view === 'next7') {
      const tasks = getTasksForNext7Days();
      return NextResponse.json({ success: true, data: tasks });
    }

    if (view === 'upcoming') {
      const tasks = getUpcomingTasks();
      return NextResponse.json({ success: true, data: tasks });
    }

    if (view === 'all') {
      const tasks = getAllTasks();
      return NextResponse.json({ success: true, data: tasks });
    }

    if (listId) {
      const tasks = getTasks(listId, date || undefined);
      return NextResponse.json({ success: true, data: tasks });
    }

    if (date) {
      const tasks = getTasks(undefined, date);
      return NextResponse.json({ success: true, data: tasks });
    }

    const tasks = getInboxTasks();
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newTask = createTask(body);
    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updatedTask = updateTask(id, data);
    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}
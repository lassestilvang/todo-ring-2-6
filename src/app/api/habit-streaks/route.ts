import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getHabitStreak,
  getAllHabitStreaks,
  createHabitStreak,
  resetHabitStreak,
  getTaskById,
} from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      const streak = getHabitStreak(taskId);
      if (!streak) {
        // Create a new streak entry for this task
        const task = getTaskById(taskId);
        if (!task) {
          return jsonError('Task not found', 404, 'TASK_NOT_FOUND');
        }
        const newStreak = createHabitStreak(taskId);
        return jsonSuccess(newStreak);
      }
      return jsonSuccess(streak);
    }

    // Return all streaks with task info
    const streaks = getAllHabitStreaks();
    const streaksWithTasks = streaks.map(s => {
      const task = getTaskById(s.taskId);
      return {
        ...s,
        taskTitle: task?.title || 'Unknown Task',
        taskPriority: task?.priority,
      };
    });

    return jsonSuccess(streaksWithTasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch habit streaks';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return jsonError('taskId is required', 400, 'MISSING_TASK_ID');
    }

    const task = getTaskById(taskId);
    if (!task) {
      return jsonError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Check if streak already exists
    const existing = getHabitStreak(taskId);
    if (existing) {
      return jsonSuccess(existing);
    }

    const streak = createHabitStreak(taskId);
    return jsonSuccess(streak, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create habit streak';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return jsonError('taskId is required', 400, 'MISSING_TASK_ID');
    }

    resetHabitStreak(taskId);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset habit streak';
    return jsonError(message, 500, 'RESET_ERROR');
  }
}
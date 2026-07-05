/**
 * Task Scheduling Assistant API
 * AI-powered optimal time slot suggestions
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { SchedulingAssistant, generateScheduleSuggestions } from '@/lib/scheduling-assistant';
import { getTaskRepository } from '@/lib/repositories';

ensureDbInitialized();

/**
 * GET /api/schedule-assistant
 * Get schedule suggestions for user's tasks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const taskId = searchParams.get('taskId');
    const days = parseInt(searchParams.get('days') || '7', 10);

    if (!userId) {
      return jsonError('User ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const assistant = new SchedulingAssistant(userId);

    // If specific task requested, suggest for that task
    if (taskId) {
      const taskRepo = getTaskRepository();
      const task = taskRepo.findById(taskId);

      if (!task) {
        return jsonError('Task not found', 404, ErrorCodes.TASK_NOT_FOUND);
      }

      const suggestions = await assistant.suggestSchedule(task);
      return jsonSuccess(suggestions);
    }

    // Otherwise, suggest for all pending tasks
    const tasks = getTaskRepository().findAll();
    const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

    const suggestions = await generateScheduleSuggestions(userId, pendingTasks);
    return jsonSuccess(suggestions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate schedule suggestions';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * POST /api/schedule-assistant
 * Get schedule suggestions for specific tasks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tasks, days } = body;

    if (!userId) {
      return jsonError('User ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return jsonError('Tasks array is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const suggestions = await generateScheduleSuggestions(userId, tasks);
    return jsonSuccess(suggestions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate schedule suggestions';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}
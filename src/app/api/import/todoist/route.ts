import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { createTask } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

/**
 * Todoist API integration for task import
 * Supports both direct task import and OAuth flow
 */
const TODOIST_API_BASE = 'https://api.todoist.com/rest/v2';

export async function GET() {
  return jsonSuccess({
    instructions: 'To import from Todoist:',
    steps: [
      '1. Create an integration at https://developer.todoist.com/',
      '2. Get your API token from the integration settings',
      '3. Use the API token to fetch tasks and import them',
    ],
    features: {
      sync: 'Sync tasks from Todoist to TaskPlanner',
      priorityMapping: {
        4: 'high',
        3: 'medium',
        2: 'low',
        1: 'none',
      },
      labels: 'Import task labels as tags',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiToken, tasks: todoistTasks } = body;

    if (!apiToken && !todoistTasks) {
      return jsonError('Either apiToken or tasks are required', 400, 'MISSING_FIELDS');
    }

    let imported = 0;
    const errors: string[] = [];

    // If API token provided, fetch tasks from Todoist
    if (apiToken && !todoistTasks) {
      const response = await fetch(`${TODOIST_API_BASE}/tasks/get_all`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!response.ok) {
        return jsonError('Failed to fetch tasks from Todoist', 400, 'TODOIST_API_ERROR');
      }

      const data = await response.json();
      const tasks = data.results || [];

      for (const task of tasks) {
        try {
          await createTask({
            title: task.content,
            description: task.description || '',
            date: task.due?.date || null,
            priority: mapTodoistPriority(task.priority),
          });
          imported++;
        } catch (err) {
          errors.push(`Task ${task.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } else if (todoistTasks && Array.isArray(todoistTasks)) {
      // Direct import of tasks
      for (const task of todoistTasks) {
        try {
          await createTask({
            title: task.title,
            description: task.description || '',
            date: task.date || null,
            priority: task.priority || 'none',
          });
          imported++;
        } catch (err) {
          errors.push(`Task ${task.id || 'unknown'}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    return jsonSuccess({
      imported,
      total: todoistTasks?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Todoist import failed';
    return jsonError(message, 500, 'IMPORT_ERROR');
  }
}

function mapTodoistPriority(priority: number): 'high' | 'medium' | 'low' | 'none' {
  switch (priority) {
    case 4: return 'high';
    case 3: return 'medium';
    case 2: return 'low';
    default: return 'none';
  }
}
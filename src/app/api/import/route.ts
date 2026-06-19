import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { createTask, createList, createLabel } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ImportDataSchema } from '@/lib/validations';

ensureDbInitialized();

interface ImportResult {
  lists: { success: number; failed: number };
  labels: { success: number; failed: number };
  tasks: { success: number; failed: number };
}

export async function POST(req: NextRequest) {
  let result: ImportResult = { lists: { success: 0, failed: 0 }, labels: { success: 0, failed: 0 }, tasks: { success: 0, failed: 0 } };

  try {
    const body = await req.json();
    const { tasks, lists, labels, version } = body.data || body;

    // Validate version
    if (version && version !== '1.0') {
      return jsonError(`Unsupported version: ${version}. Expected 1.0`, 400, 'UNSUPPORTED_VERSION');
    }

    // Validate import data structure
    const validated = ImportDataSchema.safeParse({ tasks, lists, labels, version });
    if (!validated.success) {
      return jsonError('Invalid import data structure', 400, 'VALIDATION_ERROR');
    }

    // Import lists first
    if (lists && Array.isArray(lists)) {
      for (const list of lists) {
        try {
          if (!list.name) {
            result.lists.failed++;
            continue;
          }
          createList({
            name: list.name,
            color: list.color || '#3b82f6',
            emoji: list.emoji || '📋',
          });
          result.lists.success++;
        } catch (e) {
          result.lists.failed++;
        }
      }
    }

    // Import labels
    if (labels && Array.isArray(labels)) {
      for (const label of labels) {
        try {
          if (!label.name || !label.color) {
            result.labels.failed++;
            continue;
          }
          createLabel({
            name: label.name,
            color: label.color,
            icon: label.icon || '🏷',
          });
          result.labels.success++;
        } catch (e) {
          result.labels.failed++;
        }
      }
    }

    // Import tasks
    if (tasks && Array.isArray(tasks)) {
      for (const task of tasks) {
        try {
          if (!task.title) {
            result.tasks.failed++;
            continue;
          }
          createTask({
            title: task.title,
            description: task.description || '',
            listId: task.listId || null,
            date: task.date || null,
            deadline: task.deadline || null,
            estimateHours: task.estimateHours || 0,
            estimateMinutes: task.estimateMinutes || 0,
            priority: task.priority || 'none',
            recurringType: task.recurringType || 'none',
            recurringInterval: task.recurringInterval || '',
            isAllDay: task.isAllDay || false,
          });
          result.tasks.success++;
        } catch (e) {
          result.tasks.failed++;
        }
      }
    }

    const totalSuccess = result.lists.success + result.labels.success + result.tasks.success;
    const totalFailed = result.lists.failed + result.labels.failed + result.tasks.failed;

    return jsonSuccess({
      message: `Import completed: ${totalSuccess} items imported, ${totalFailed} failed`,
      details: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import data';
    return jsonError(message, 500, 'IMPORT_ERROR');
  }
}
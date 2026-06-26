import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { createTask } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

/**
 * Notion database import
 * Accepts Notion database export or API response
 */
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { tasks: notionTasks } = body;

    if (!notionTasks || !Array.isArray(notionTasks)) {
      return jsonError('No tasks provided', 400, 'MISSING_TASKS');
    }

    let imported = 0;
    const errors: string[] = [];

    for (const notionTask of notionTasks) {
      try {
        // Map Notion properties to Task fields
        const title = notionTask.properties?.Name?.title?.[0]?.text?.content || 'Untitled';
        const description = notionTask.properties?.Description?.rich_text?.map((rt: any) => rt.plain_text).join('\n') || '';
        const dateStr = notionTask.properties?.Date?.date?.start;
        const priorityRaw = notionTask.properties?.Priority?.select?.name?.toLowerCase();
        const priority = ['high', 'medium', 'low'].includes(priorityRaw) ? priorityRaw : 'none';

        await createTask({
          title,
          description,
          date: dateStr || null,
          priority,
        });

        imported++;
      } catch (err) {
        const taskId = notionTask.id || 'unknown';
        errors.push(`Task ${taskId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return jsonSuccess({
      imported,
      total: notionTasks.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Notion import failed';
    return jsonError(message, 500, 'IMPORT_ERROR');
  }
}

/**
 * Notion API connection info
 */
export async function GET() {
  return jsonSuccess({
    instructions: 'To import from Notion:',
    steps: [
      '1. Create a database in Notion with columns: Name, Description, Date, Priority',
      '2. Get your Notion Integration token from https://www.notion.so/my-integrations',
      '3. Share your database with the integration',
      '4. Use the Notion API to fetch pages and POST to this endpoint',
    ],
    properties: {
      Name: 'Task title (required)',
      Description: 'Task description',
      Date: 'Due date (YYYY-MM-DD format)',
      Priority: 'Select: "high", "medium", or "low"',
    },
  });
}
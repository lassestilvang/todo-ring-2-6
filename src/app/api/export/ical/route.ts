import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, getAllLists, getAllLabels } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import type { Task } from '@/types/index';

ensureDbInitialized();

/**
 * Generate iCal format for tasks
 */
function generateICal(tasks: Task[]): string {
  const now = new Date();
  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskPlanner//TaskPlanner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TaskPlanner Tasks',
    'X-WR-TIMEZONE:America/Los_Angeles',
    '',
  ];

  for (const task of tasks) {
    if (!task.date && !task.deadline) continue;

    const uid = `${task.id}@taskplanner.app`;
    const dtStamp = now.toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z';

    icalLines.push('BEGIN:VEVENT');
    icalLines.push(`UID:${uid}`);
    icalLines.push(`DTSTAMP:${dtStamp}`);

    if (task.date) {
      const dateStr = task.date.replace(/-/g, '');
      icalLines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    }

    if (task.deadline) {
      const dateStr = task.deadline.replace(/-/g, '');
      icalLines.push(`DUE;VALUE=DATE:${dateStr}`);
    }

    icalLines.push(`SUMMARY:${escapeICal(task.title)}`);

    if (task.description) {
      icalLines.push(`DESCRIPTION:${escapeICal(task.description)}`);
    }

    if (task.priority === 'high') {
      icalLines.push('PRIORITY:1');
    } else if (task.priority === 'medium') {
      icalLines.push('PRIORITY:5');
    } else if (task.priority === 'low') {
      icalLines.push('PRIORITY:9');
    }

    const status = task.status === 'completed' ? 'COMPLETED' : 'CONFIRMED';
    icalLines.push(`STATUS:${status}`);

    icalLines.push('END:VEVENT');
    icalLines.push('');
  }

  icalLines.push('END:VCALENDAR');
  return icalLines.join('\r\n');
}

function escapeICal(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'ical';

    const tasks = getTasks();
    const lists = getAllLists();
    const labels = getAllLabels();

    if (format === 'ical') {
      const icalContent = generateICal(tasks);

      return new Response(icalContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename=taskplanner-tasks.ics',
        },
      });
    }

    if (format === 'json') {
      return jsonSuccess({
        tasks,
        lists,
        labels,
        exportedAt: new Date().toISOString(),
      });
    }

    return jsonError('Unsupported format. Use "ical" or "json"', 400, 'UNSUPPORTED_FORMAT');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export';
    return jsonError(message, 500, 'EXPORT_ERROR');
  }
}
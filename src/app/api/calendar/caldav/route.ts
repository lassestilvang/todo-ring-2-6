// NextRequest removed - not used
import { ensureDbInitialized } from '@/lib/db-init';
import { getAllTasks } from '@/db/operations';
import { jsonError } from '@/lib/api-response';
import type { Task } from '@/types/index';

ensureDbInitialized();

/**
 * Generate iCal (.ics) format for calendar sync
 * This implements a basic CalDAV-compatible export
 */
function generateICS(tasks: Task[]): string {
  const now = new Date().toISOString();
  const ics: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskPlanner//TaskPlanner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const task of tasks) {
    if (!task.date && !task.deadline) continue;

    const uid = task.id.replace(/[^a-zA-Z0-9]/g, '');
    const dtstamp = now.replace(/[-:]/g, '').split('.')[0];

    // Start time
    const dtstart = task.date ? `${task.date.replace(/-/g, '')}T090000` : null;
    
    // Due time
    const due = task.deadline ? `${task.deadline.replace(/-/g, '')}T235959` : null;

    const event: string[] = [
      'BEGIN:VEVENT',
      `UID:${uid}@taskplanner.local`,
      `DTSTAMP:${dtstamp}`,
      `CREATED:${dtstamp}`,
      `LAST-MODIFIED:${dtstamp}`,
      `SUMMARY:${task.title.replace(/\n/g, '\\n')}`,
    ];

    if (task.description) {
      event.push(`DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`);
    }

    if (dtstart) {
      event.push(`DTSTART:${dtstart}`);
    }

    if (due) {
      event.push(`DUE:${due}`);
    }

    if (task.status === 'completed') {
      event.push('STATUS:COMPLETED');
    } else if (task.status === 'cancelled') {
      event.push('STATUS:CANCELLED');
    } else {
      event.push('STATUS:TODO');
    }

    // Priority mapping
    if (task.priority === 'high') {
      event.push('PRIORITY:1');
    } else if (task.priority === 'medium') {
      event.push('PRIORITY:5');
    } else if (task.priority === 'low') {
      event.push('PRIORITY:9');
    }

    event.push('END:VEVENT');
    ics.push(...event);
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export async function GET() {
  try {
    const tasks = getAllTasks() as Task[] as Task[];
    const icsContent = generateICS(tasks);

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="tasks.ics"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate calendar';
    return jsonError(message, 500, 'CALENDAR_ERROR');
  }
}

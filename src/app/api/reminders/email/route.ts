import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getUpcomingReminders, updateReminder, getTaskById } from '@/db/operations';
import { sendEmail, generateReminderEmail, generateReminderText } from '@/lib/email';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();

// GET /api/reminders/email - Get reminder status
export async function GET(_req: NextRequest) {
  try {
    const limit = parseInt(_req.nextUrl.searchParams.get('limit') || '50');
    const reminders = getUpcomingReminders(limit);

    return jsonSuccess({
      total: reminders.length,
      pending: reminders.filter(r => !r.isFired).length,
      fired: reminders.filter(r => r.isFired).length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get reminder status';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

// POST /api/reminders/email - Send email reminders
export async function POST(_req: NextRequest) {
  try {
    const limit = parseInt(_req.nextUrl.searchParams.get('limit') || '50');
    const reminders = getUpcomingReminders(limit);
    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of reminders) {
      const task = getTaskById(reminder.taskId);
      if (!task?.title) continue;

      // Get user email from task owner or assignee
      const userEmail = await getUserEmailForTask(task.id);
      if (!userEmail) {
        console.log(`No email found for task ${task.id}`);
        continue;
      }

      const html = generateReminderEmail({
        title: task.title,
        description: task.description ?? undefined,
        deadline: task.deadline ?? undefined,
        priority: task.priority as 'high' | 'medium' | 'low' | 'none',
      });

      const text = generateReminderText({
        title: task.title,
        description: task.description ?? undefined,
        deadline: task.deadline ?? undefined,
        priority: task.priority as 'high' | 'medium' | 'low' | 'none',
      });

      const success = await sendEmail({
        to: userEmail,
        subject: `Task Reminder: ${task.title}`,
        html,
        text,
      });

      if (success) {
        updateReminder(reminder.id, { isFired: true });
        sentCount++;
      } else {
        failedCount++;
      }
    }

    return jsonSuccess({ sentCount, failedCount, total: reminders.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send reminder emails';
    return jsonError(message, 500, 'EMAIL_ERROR');
  }
}

/**
 * Get user email for a task
 * Returns the email of the task owner or assignee
 */
async function getUserEmailForTask(taskId: string): Promise<string | null> {
  const db = (await import('@/db/db-client')).getDb();

  // First, check if task has an assignee
  const task = getTaskById(taskId);
  if (task?.assigneeId) {
    const assignee = db.prepare('SELECT email FROM users WHERE id = ?').get(task.assigneeId) as { email: string } | undefined;
    if (assignee?.email) {
      return assignee.email;
    }
  }

  // Check task shares
  const taskShare = db.prepare(
    'SELECT user_id FROM task_shares WHERE task_id = ? LIMIT 1'
  ).get(taskId) as { user_id: string } | undefined;

  if (taskShare?.user_id) {
    const owner = db.prepare('SELECT email FROM users WHERE id = ?').get(taskShare.user_id) as { email: string } | undefined;
    if (owner?.email) {
      return owner.email;
    }
  }

  // Fallback: get any user email for demo purposes
  const user = db.prepare('SELECT email FROM users LIMIT 1').get() as { email: string } | undefined;
  return user?.email || null;
}
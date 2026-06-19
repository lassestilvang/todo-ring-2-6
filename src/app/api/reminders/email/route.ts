import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getUpcomingReminders, updateReminder, getTaskById } from '@/db/operations';
import { sendEmail, generateReminderEmail, generateReminderText } from '@/lib/email';

// Ensure database is initialized
ensureDbInitialized();

export async function GET() {
  try {
    // Get upcoming reminders
    const reminders = getUpcomingReminders(50);

    let sentCount = 0;

    for (const reminder of reminders) {
      const task = getTaskById(reminder.taskId);
      if (!task?.title) continue;

      // In production, you'd have user email stored
      const userEmail = 'user@example.com'; // Placeholder

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
        // Mark reminder as fired
        updateReminder(reminder.id, { isFired: true });
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: reminders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reminder emails' },
      { status: 500 }
    );
  }
}
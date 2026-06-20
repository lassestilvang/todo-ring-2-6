/**
 * Notification service for sending reminders via email and push notifications
 */

import webPush from 'web-push';
import nodemailer from 'nodemailer';
import { getUpcomingReminders, updateReminder, getTaskById, getDb } from '@/db/operations';

// Configure web-push
webPush.setVapidDetails(
  'TaskPlanner',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh6U',
  process.env.VAPID_PRIVATE_KEY || 'DIFFERENT_KEY'
);

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email using nodemailer
 */
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP not configured, simulating email send');
      return true;
    }

    await transporter.sendMail({
      from: `"TaskPlanner" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Generate reminder email HTML
 */
function generateReminderEmailHtml(task: {
  title: string;
  description?: string;
  deadline?: string | null;
  priority?: 'high' | 'medium' | 'low' | 'none';
}): string {
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
  };

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Task Reminder</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="margin-top: 0; color: #333;">${task.title}</h2>
        ${task.description ? `<p style="color: #666; line-height: 1.6;">${task.description}</p>` : ''}
        <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 6px;">
          ${task.priority ? `
            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: ${priorityColors[task.priority] || '#666'}; background: ${priorityColors[task.priority] || '#666'}20;">
              ${task.priority.toUpperCase()} PRIORITY
            </span>
          ` : ''}
          ${task.deadline ? `
            <div style="margin-top: 10px; color: #666; font-size: 14px;">
              <strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This is an automated reminder from TaskPlanner. You can manage your notification settings in the app.
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate text fallback for email
 */
function generateReminderText(task: {
  title: string;
  description?: string;
  deadline?: string | null;
  priority?: string;
}): string {
  let text = `Task: ${task.title}\n\n`;

  if (task.description) {
    text += `Description: ${task.description}\n\n`;
  }

  if (task.priority) {
    text += `Priority: ${task.priority.toUpperCase()}\n\n`;
  }

  if (task.deadline) {
    text += `Deadline: ${new Date(task.deadline).toLocaleDateString()}\n\n`;
  }

  text += 'This is an automated reminder from TaskPlanner.';

  return text;
}

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Send a push notification to a user's device
 */
async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const pushSub: webPush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };
    await webPush.sendNotification(pushSub, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Process and send pending notifications
 * This should be called periodically (e.g., via cron job or scheduled task)
 */
export async function processPendingNotifications(): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const now = new Date().toISOString();
  const reminders = getUpcomingReminders(100);
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    // Check if it's time to send
    if (new Date(reminder.remindAt) > new Date(now)) {
      skipped++;
      continue;
    }

    const task = getTaskById(reminder.taskId);
    if (!task) {
      skipped++;
      continue;
    }

    try {
      if (reminder.method === 'email') {
        // Get user email from task or subscription
        const userEmail = await getUserEmailForTask(task.id);
        if (!userEmail) {
          skipped++;
          continue;
        }

        const emailHtml = generateReminderEmailHtml({
          title: task.title,
          description: task.description,
          deadline: task.deadline ?? undefined,
          priority: task.priority as 'high' | 'medium' | 'low' | 'none',
        });
        const emailText = generateReminderText({
          title: task.title,
          description: task.description,
          deadline: task.deadline ?? undefined,
          priority: task.priority,
        });

        const success = await sendEmail({
          to: userEmail,
          subject: `Task Reminder: ${task.title}`,
          html: emailHtml,
          text: emailText,
        });

        if (success) {
          updateReminder(reminder.id, { isFired: true });
          sent++;
        } else {
          failed++;
        }
      } else {
        // Push notification
        const subscriptions = await getUserSubscriptions('current-user');
        let pushSent = false;

        for (const sub of subscriptions) {
          const payload: NotificationPayload = {
            title: 'Task Reminder',
            body: task.description || task.title,
            icon: '/favicon.ico',
            tag: `task-${task.id}`,
            data: { taskId: task.id, url: `/tasks/${task.id}` },
          };

          const success = await sendPushNotification(sub as any, payload);
          if (success) {
            pushSent = true;
          }
        }

        if (pushSent) {
          updateReminder(reminder.id, { isFired: true });
          sent++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error('Failed to send notification for task', task.id, error);
      failed++;
    }
  }

  return { sent, failed, skipped };
}

/**
 * Get user email for a task (from sharing or ownership)
 */
async function getUserEmailForTask(taskId: string): Promise<string | null> {
  // In a real app, this would look up the user's email from the database
  // For now, we return null to indicate email is needed
  const task = getTaskById(taskId);
  if (!task) return null;

  // Check if task has an owner or shared users
  // This is a placeholder - in production you'd query a users table
  return null;
}

/**
 * Get push subscriptions for a user
 */
async function getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
  const db = getDb();
  return db.prepare(
    'SELECT id, user_id as userId, endpoint, p256dh, auth, created_at as createdAt FROM push_subscriptions WHERE user_id = ?'
  ).all(userId) as PushSubscription[];
}

/**
 * Create a reminder for a task
 */
export async function createTaskReminder(
  taskId: string,
  remindAt: string,
  method: 'notification' | 'email' = 'notification'
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  try {
    const task = getTaskById(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO reminders (id, task_id, remind_at, method, is_fired, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    ).run(id, taskId, remindAt, method, now);

    return { success: true, reminderId: id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create reminder';
    return { success: false, error: message };
  }
}

/**
 * Snooze a reminder
 */
export async function snoozeReminder(
  reminderId: string,
  minutes: number = 10
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(reminderId) as {
      remindAt: string;
      isFired: number;
    };

    if (!reminder) {
      return { success: false, error: 'Reminder not found' };
    }

    // Calculate new reminder time
    const newTime = new Date(new Date(reminder.remindAt).getTime() + minutes * 60000);

    db.prepare('UPDATE reminders SET remind_at = ?, is_fired = 0 WHERE id = ?').run(
      newTime.toISOString(),
      reminderId
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to snooze reminder';
    return { success: false, error: message };
  }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: NotificationPayload = {
      title: 'TaskPlanner Test',
      body: 'Your notification setup is working!',
      icon: '/favicon.ico',
    };

    // Get user's push subscriptions
    const subscriptions = await getUserSubscriptions(userId);

    for (const sub of subscriptions) {
      await sendPushNotification(sub as any, payload);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send test notification';
    return { success: false, error: message };
  }
}
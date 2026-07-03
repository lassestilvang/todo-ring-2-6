/**
 * Notification Service
 * Handles email and push notifications
 */

interface NotificationConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig = {}) {
    this.config = config;
  }

  /**
   * Send an email notification
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // In production, this would use nodemailer or similar
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);

    if (this.config.smtpHost) {
      try {
        // Mock implementation - in production, use actual SMTP
        // const transporter = nodemailer.createTransporter(this.config);
        // await transporter.sendMail({ from: this.config.smtpUser, to, subject, html, text });
        return true;
      } catch (error) {
        console.error('Email send failed:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Send task reminder
   */
  async sendTaskReminder(
    userId: string,
    userEmail: string,
    task: { title: string; dueDate: string }
  ): Promise<void> {
    const subject = `Task Reminder: ${task.title}`;
    const html = `
      <h2>Task Reminder</h2>
      <p>You have a task due soon:</p>
      <h3>${task.title}</h3>
      <p>Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
      <a href="${process.env.NEXTAUTH_URL}/tasks/${task.id}">View Task</a>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send assignment notification
   */
  async sendAssignmentNotification(
    assigneeEmail: string,
    task: { title: string; assignerName: string }
  ): Promise<void> {
    const subject = `You've been assigned a task`;
    const html = `
      <h2>New Task Assignment</h2>
      <p>${task.assignerName} has assigned you a new task:</p>
      <h3>${task.title}</h3>
      <a href="${process.env.NEXTAUTH_URL}/tasks">View Tasks</a>
    `;

    await this.sendEmail({
      to: assigneeEmail,
      subject,
      html,
    });
  }

  /**
   * Send comment mention notification
   */
  async sendMentionNotification(
    userEmail: string,
    userName: string,
    comment: { content: string; taskTitle: string }
  ): Promise<void> {
    const subject = `You were mentioned in a comment`;
    const html = `
      <h2>Comment Mention</h2>
      <p>${userName} mentioned you in a comment on task: ${comment.taskTitle}</p>
      <blockquote>${comment.content}</blockquote>
      <a href="${process.env.NEXTAUTH_URL}/tasks">View Task</a>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }
}

// Export singleton instance
let notificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService({
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    });
  }
  return notificationService;
}

export { NotificationService };
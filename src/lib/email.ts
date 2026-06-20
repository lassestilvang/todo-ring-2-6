/**
 * Email service for task reminders
 * Supports SMTP-based email sending
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as nodemailer.TransportOptions);
  }
  return transporter;
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Send an email using SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!isEmailConfigured()) {
      console.log('SMTP not configured, simulating email:', {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    const mailOptions = {
      from: `"TaskPlanner" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Generate reminder email HTML
 */
export function generateReminderEmail(task: {
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
export function generateReminderText(task: {
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

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Hello,
        </p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          You recently requested a password reset for your TaskPlanner account.
        </p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Reset Your Password
          </a>
        </div>
        <p style="font-size: 14px; color: #999; line-height: 1.6;">
          This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          This is an automated email from TaskPlanner.
        </p>
      </div>
    </div>
  `;

  const text = `
    Hello,

    You recently requested a password reset for your TaskPlanner account.

    Please click the link below to reset your password:
    ${resetUrl}

    This link will expire in 24 hours. If you didn't request this reset, please ignore this email.

    This is an automated email from TaskPlanner.
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - TaskPlanner',
    html,
    text,
  });
}
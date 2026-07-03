/**
 * Email Background Job Processor
 * Processes email sending jobs using BullMQ
 */

import { Job } from 'bullmq';
import nodemailer from 'nodemailer';

// Email job data interface
export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

// Create transporter
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
 * Process email job
 */
export async function emailProcessor(job: Job<EmailJobData>): Promise<void> {
  const { to, subject, html, text, attachments } = job.data;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
      attachments,
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Queue names for email processor
 */
export const EMAIL_QUEUE = 'email';
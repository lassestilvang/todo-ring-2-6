import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, generateReminderEmail, generateReminderText } from '../../src/lib/email';
import type { Task } from '../../src/types';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransporter: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

describe('Notification Email System', () => {
  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    listId: 'list-1',
    date: null,
    deadline: '2024-12-31',
    priority: 'high',
    status: 'pending',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  };

  describe('generateReminderEmail', () => {
    it('should generate HTML email with task details', () => {
      const html = generateReminderEmail(mockTask);
      expect(html).toContain(mockTask.title);
      expect(html).toContain(mockTask.description);
      // Deadline is formatted as "12/31/2024" in the email
      expect(html).toContain('12/31/2024');
    });
  });

  describe('generateReminderText', () => {
    it('should generate plain text email with task details', () => {
      const text = generateReminderText(mockTask);
      expect(text).toContain(mockTask.title);
      // Priority is uppercase in the email
      expect(text).toContain('HIGH');
    });
  });

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test'
      });
      expect(result).toBe(true);
    });
  });
});
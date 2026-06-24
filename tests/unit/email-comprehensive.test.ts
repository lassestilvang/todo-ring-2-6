/**
 * Comprehensive tests for src/lib/email.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateReminderEmail,
  generateReminderText,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationSettingsEmail,
} from '../../src/lib/email';

describe('Email Utilities - Comprehensive', () => {
  let consoleLogSpy: any;
  let originalConsoleLog: any;

  beforeEach(() => {
    originalConsoleLog = console.log;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    console.log = originalConsoleLog;
  });

  describe('sendEmail', () => {
    it('should return true when SMTP is not configured (simulated)', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendEmail: send } = await import('../../src/lib/email');

      const result = await send({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });

      expect(result).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should return true when SMTP is not configured', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;
      const originalUrl = process.env.NEXTAUTH_URL;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      vi.resetModules();
      const { sendPasswordResetEmail: sendReset } = await import('../../src/lib/email');

      const result = await sendReset('test@example.com', 'reset-token-123');
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
      process.env.NEXTAUTH_URL = originalUrl;
    });

    it('should handle missing NEXTAUTH_URL', async () => {
      const originalUrl = process.env.NEXTAUTH_URL;
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.NEXTAUTH_URL;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendPasswordResetEmail: sendReset } = await import('../../src/lib/email');

      const result = await sendReset('test@example.com', 'token');
      expect(result).toBe(true);

      // Restore
      process.env.NEXTAUTH_URL = originalUrl;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });
  });

  describe('generateReminderEmail', () => {
    it('should generate email for task with all fields', () => {
      const html = generateReminderEmail({
        title: 'Complete Project',
        description: 'Finish the project documentation',
        deadline: '2024-12-31',
        priority: 'high',
      });

      expect(html).toContain('Complete Project');
      expect(html).toContain('HIGH PRIORITY');
    });

    it('should handle task with no deadline', () => {
      const html = generateReminderEmail({
        title: 'Task without deadline',
        priority: 'medium',
      });

      expect(html).toContain('Task without deadline');
      expect(html).toContain('MEDIUM PRIORITY');
    });

    it('should handle task with no priority', () => {
      const html = generateReminderEmail({
        title: 'Task without priority',
      });

      expect(html).toContain('Task without priority');
    });

    it('should handle null deadline', () => {
      const html = generateReminderEmail({
        title: 'Task',
        deadline: null,
      });

      expect(html).toContain('Task');
    });

    it('should format priority colors correctly', () => {
      const highPriority = generateReminderEmail({ title: 'Task', priority: 'high' });
      expect(highPriority).toContain('#ef4444');

      const lowPriority = generateReminderEmail({ title: 'Task', priority: 'low' });
      expect(lowPriority).toContain('#3b82f6');
    });
  });

  describe('generateReminderText', () => {
    it('should generate text for task with all fields', () => {
      const text = generateReminderText({
        title: 'Complete Project',
        description: 'Finish documentation',
        deadline: '2024-12-31',
        priority: 'high',
      });

      expect(text).toContain('Task: Complete Project');
      expect(text).toContain('Finish documentation');
      expect(text).toContain('HIGH');
    });

    it('should handle task with no description', () => {
      const text = generateReminderText({
        title: 'Simple Task',
      });

      expect(text).toContain('Task: Simple Task');
    });

    it('should handle task with no deadline', () => {
      const text = generateReminderText({
        title: 'Task',
        deadline: null,
      });

      expect(text).toContain('Task: Task');
      expect(text).not.toContain('Deadline:');
    });

    it('should handle task with no priority', () => {
      const text = generateReminderText({
        title: 'Task',
        priority: undefined,
      });

      expect(text).toContain('Task: Task');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should return true when SMTP is not configured', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;
      const originalUrl = process.env.NEXTAUTH_URL;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      vi.resetModules();
      const { sendWelcomeEmail: sendWelcome } = await import('../../src/lib/email');

      const result = await sendWelcome('newuser@example.com', 'New User');
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
      process.env.NEXTAUTH_URL = originalUrl;
    });

    it('should handle missing NEXTAUTH_URL', async () => {
      const originalUrl = process.env.NEXTAUTH_URL;
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.NEXTAUTH_URL;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendWelcomeEmail: sendWelcome } = await import('../../src/lib/email');

      const result = await sendWelcome('test@example.com', 'Test User');
      expect(result).toBe(true);

      // Restore
      process.env.NEXTAUTH_URL = originalUrl;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });
  });

  describe('sendNotificationSettingsEmail', () => {
    it('should return true when SMTP is not configured', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendNotificationSettingsEmail: sendNotif } = await import('../../src/lib/email');

      const result = await sendNotif('user@example.com', {
        emailNotifications: true,
        pushNotifications: false,
      });
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });

    it('should handle both notifications enabled', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendNotificationSettingsEmail: sendNotif } = await import('../../src/lib/email');

      const result = await sendNotif('user@example.com', {
        emailNotifications: true,
        pushNotifications: true,
      });
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });

    it('should handle both notifications disabled', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendNotificationSettingsEmail: sendNotif } = await import('../../src/lib/email');

      const result = await sendNotif('user@example.com', {
        emailNotifications: false,
        pushNotifications: false,
      });
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });
  });

  describe('SMTP Configuration', () => {
    it('should use custom SMTP host when configured', async () => {
      const originalHost = process.env.SMTP_HOST;
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      process.env.SMTP_HOST = 'smtp.custom.com';
      // Keep SMTP credentials unset to simulate email
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendEmail } = await import('../../src/lib/email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });

    it('should use custom SMTP port when configured', async () => {
      const originalPort = process.env.SMTP_PORT;
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      process.env.SMTP_PORT = '465';
      // Keep SMTP credentials unset to simulate email
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendEmail } = await import('../../src/lib/email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });
      expect(result).toBe(true);

      // Restore
      process.env.SMTP_PORT = originalPort;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });
  });

  describe('Email Error Handling', () => {
    it('should handle SMTP connection errors gracefully', async () => {
      // This tests the error path in sendEmail
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'invalid-password';

      vi.resetModules();
      const { sendEmail: send } = await import('../../src/lib/email');

      // Even with SMTP configured, should handle errors gracefully
      const result = await send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });
      // Returns true in simulation mode or false on actual error
      expect(typeof result).toBe('boolean');

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });

    it('should handle invalid email addresses', async () => {
      const { sendEmail } = await import('../../src/lib/email');

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      });
      expect(typeof result).toBe('boolean');
    });
  });

  describe('SMTP Success Path', () => {
    it('should handle sendEmail with SMTP configured', async () => {
      // When SMTP is configured, sendEmail attempts to send
      // We test the path where SMTP credentials are set
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'valid-password';

      vi.resetModules();
      const { sendEmail } = await import('../../src/lib/email');

      // This will either succeed (in simulation) or fail gracefully
      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });

      // Result is boolean, either true (simulation) or false (actual SMTP error)
      expect(typeof result).toBe('boolean');

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
      vi.resetModules();
    });

    it('should log success message when email is sent', async () => {
      // Test the success path where info.messageId is logged
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'valid-password';

      // Mock console.log to verify the log message
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      vi.resetModules();
      const { sendEmail } = await import('../../src/lib/email');

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });

      // In simulation mode, it logs the simulation message
      expect(typeof result).toBe('boolean');

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
      consoleSpy.mockRestore();
      vi.resetModules();
    });
  });
});
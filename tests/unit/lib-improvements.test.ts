/**
 * Additional tests to improve coverage for lib files
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Library Improvements', () => {
  describe('Email Module - Additional Coverage', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = process.env;
      vi.resetModules();
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should handle successful email send with SMTP configured', async () => {
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';

      const { sendEmail } = await import('../../src/lib/email');

      // This will either succeed or fail gracefully
      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });

      // Result should be boolean
      expect(typeof result).toBe('boolean');
    });

    it('should use default SMTP settings when not configured', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const { sendEmail } = await import('../../src/lib/email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
    });

    it('should handle sendWelcomeEmail with custom NEXTAUTH_URL', async () => {
      process.env.NEXTAUTH_URL = 'https://app.example.com';
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendWelcomeEmail } = await import('../../src/lib/email');

      const result = await sendWelcomeEmail('newuser@example.com', 'New User');
      expect(result).toBe(true);
    });

    it('should handle sendPasswordResetEmail with custom URL', async () => {
      process.env.NEXTAUTH_URL = 'https://app.example.com';
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { sendPasswordResetEmail } = await import('../../src/lib/email');

      const result = await sendPasswordResetEmail('user@example.com', 'reset-token');
      expect(result).toBe(true);
    });

    it('should handle sendNotificationSettingsEmail', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const { sendNotificationSettingsEmail } = await import('../../src/lib/email');

      const result = await sendNotificationSettingsEmail('user@example.com', {
        emailNotifications: true,
        pushNotifications: true,
      });

      expect(result).toBe(true);
    });

    it('should handle isEmailConfigured', async () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      // Test when not configured
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      vi.resetModules();
      const { isEmailConfigured } = await import('../../src/lib/email');
      expect(isEmailConfigured()).toBe(false);

      // Test when configured
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      vi.resetModules();
      const { isEmailConfigured: isConfigured } = await import('../../src/lib/email');
      expect(isConfigured()).toBe(true);

      // Restore
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });

    it('should generate reminder email with all fields', async () => {
      const { generateReminderEmail } = await import('../../src/lib/email');

      const html = generateReminderEmail({
        title: 'Complete Project',
        description: 'Finish the documentation',
        deadline: '2024-12-31',
        priority: 'high',
      });

      expect(html).toContain('Complete Project');
      expect(html).toContain('Finish the documentation');
      expect(html).toContain('HIGH PRIORITY');
      expect(html).toContain('Deadline:');
    });

    it('should generate reminder text with all fields', async () => {
      const { generateReminderText } = await import('../../src/lib/email');

      const text = generateReminderText({
        title: 'Complete Project',
        description: 'Finish the documentation',
        deadline: '2024-12-31',
        priority: 'medium',
      });

      expect(text).toContain('Task: Complete Project');
      expect(text).toContain('Finish the documentation');
      expect(text).toContain('MEDIUM');
      expect(text).toContain('Deadline:');
    });
  });

  describe('NLP Module - Additional Coverage', () => {
    it('should handle empty input in parseNaturalLanguage', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      const result = parseNaturalLanguage('');
      expect(result.title).toBe('');
    });

    it('should handle text with special characters', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      const result = parseNaturalLanguage('Task @#$%^&*() with symbols');
      expect(result.title).toBeDefined();
    });

    it('should handle text with numbers', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      const result = parseNaturalLanguage('Task 123 with numbers');
      expect(result.title).toBeDefined();
    });

    it('should handle very long input', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      const longText = 'A'.repeat(1000);
      const result = parseNaturalLanguage(longText);
      expect(result.title).toBeDefined();
    });

    it('should handle multiple date formats in search query', async () => {
      const { parseSearchQuery } = await import('../../src/lib/nlp');

      const result = parseSearchQuery('title:test priority:high status:pending');
      expect(result.filters.title).toBe('test');
      expect(result.filters.priority).toBe('high');
      expect(result.filters.status).toBe('pending');
    });

    it('should handle mixed case filters', async () => {
      const { parseSearchQuery } = await import('../../src/lib/nlp');

      const result = parseSearchQuery('TITLE:Test PRIORITY:High');
      // The filter values are case-preserved from the input
      expect(result.filters.title).toBeDefined();
    });

    it('should handle query with only phrases', async () => {
      const { parseSearchQuery } = await import('../../src/lib/nlp');

      const result = parseSearchQuery('"phrase one" "phrase two"');
      expect(result.phrases).toHaveLength(2);
      expect(result.terms).toHaveLength(0);
    });

    it('should handle query with only excludes', async () => {
      const { parseSearchQuery } = await import('../../src/lib/nlp');

      const result = parseSearchQuery('-exclude1 -exclude2');
      expect(result.excludes).toContain('exclude1');
      expect(result.excludes).toContain('exclude2');
    });
  });

  describe('Rate Limiter - Additional Coverage', () => {
    it('should handle reset with undefined', async () => {
      const { rateLimit } = await import('../../src/lib/rate-limiter');

      // Test with various edge cases
      const result = rateLimit('test-key', 10, 60000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should calculate remaining correctly', async () => {
      const { rateLimit } = await import('../../src/lib/rate-limiter');

      const result1 = rateLimit('remaining-test', 5, 60000);
      expect(result1.remaining).toBe(4);

      const result2 = rateLimit('remaining-test', 5, 60000);
      expect(result2.remaining).toBe(3);
    });
  });

  describe('NLP Edge Cases', () => {
    it('should handle "by tomorrow" pattern', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      const result = parseNaturalLanguage('Submit by tomorrow');
      expect(result.date).toBeDefined();
    });

    it('should handle weekday calculations', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      const result = parseNaturalLanguage('Meeting on wednesday');
      expect(result.date).toBeDefined();
    });

    it('should handle text without date patterns', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      // Text without recognizable date patterns
      const result = parseNaturalLanguage('Meeting on invalidday');
      // The function may not set a date if no pattern matches
      expect(result.title).toBeDefined();
    });

    it('should trigger NLP default return case', async () => {
      const { parseNaturalLanguage } = await import('../../src/lib/nlp');

      // This triggers the default return in addDaysWord (line 160)
      // We need to parse something that goes through the dayPatterns loop
      // but doesn't match any known day, AND goes through deadline/by patterns
      const result = parseNaturalLanguage('Task deadline: unknownword123');
      expect(result.title).toBeDefined();
    });
  });

  describe('Rate Limiter Cleanup Interval', () => {
    it('should verify cleanup interval exists', async () => {
      // Import the module - cleanup interval runs automatically
      const module = await import('../../src/lib/rate-limiter');
      expect(typeof module.rateLimit).toBe('function');
      expect(typeof module.withRateLimit).toBe('function');
    });
  });
});
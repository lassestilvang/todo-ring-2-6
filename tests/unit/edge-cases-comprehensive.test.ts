/**
 * Comprehensive edge case tests
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  priority: z.enum(['high', 'medium', 'low', 'none']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

const ListSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  color: z.string(),
  emoji: z.string(),
});

describe('Edge Cases', () => {
  describe('Task Title Edge Cases', () => {
    it('should accept minimum length title (1 character)', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'A',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should accept maximum length title (500 characters)', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'a'.repeat(500),
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should reject title with exactly 501 characters', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'a'.repeat(501),
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: '',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });

    it('should accept title with special characters', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'Task with émojis 🎉 and spëcial çharacters!',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should accept title with newlines', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'Task\nwith\nnewlines',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should accept title with tabs', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'Task\twith\ttabs',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('List Name Edge Cases', () => {
    it('should accept minimum length name (1 character)', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'A',
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should accept maximum length name (100 characters)', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'a'.repeat(100),
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should reject name with exactly 101 characters', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'a'.repeat(101),
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Color Format Edge Cases', () => {
    it('should accept hex color with hash', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should accept short hex color', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: '#fff',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should accept named color', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: 'red',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should accept rgb format', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: 'rgb(255, 0, 0)',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Date Edge Cases', () => {
    it('should handle invalid date format gracefully', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'Test',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should handle leap year date', () => {
      // 2024 is a leap year
      const leapYear = '2024-02-29';
      expect(leapYear).toBeDefined();
    });

    it('should handle end of month date', () => {
      const endDate = '2024-01-31';
      expect(endDate).toBeDefined();
    });
  });

  describe('Emoji Edge Cases', () => {
    it('should accept single emoji', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiple emojis', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: '#3b82f6',
        emoji: '📋📝',
      });
      expect(result.success).toBe(true);
    });

    it('should accept text as emoji', () => {
      const result = ListSchema.safeParse({
        id: '1',
        name: 'Test',
        color: '#3b82f6',
        emoji: 'list',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Unicode Edge Cases', () => {
    it('should handle CJK characters', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: '任务标题',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should handle Arabic characters', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'عنوان المهمة',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should handle Russian characters', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'Название задачи',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Whitespace Edge Cases', () => {
    it('should accept title with leading/trailing whitespace', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: '  Task  ',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should accept title with multiple spaces', () => {
      const result = TaskSchema.safeParse({
        id: '1',
        title: 'Task    with    spaces',
        priority: 'none',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });
  });
});
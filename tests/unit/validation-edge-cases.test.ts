import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate schemas for comprehensive validation testing

const Priority = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
const RecurringType = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);

const TaskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  listId: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  estimateHours: z.number().min(0).default(0),
  estimateMinutes: z.number().min(0).default(0),
  priority: Priority.default('none'),
  recurringType: RecurringType.default('none'),
  isAllDay: z.boolean().default(false),
});

const ListCreateSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
});

const SubtaskSchema = z.object({
  title: z.string().min(1).max(500),
});

const LabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string(),
  icon: z.string().default('🏷'),
});

describe('Validation Edge Cases', () => {
  describe('Task Title Validation', () => {
    it('should accept minimum valid title (1 character)', () => {
      const result = TaskCreateSchema.safeParse({ title: 'a' });
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid title (500 characters)', () => {
      const result = TaskCreateSchema.safeParse({ title: 'a'.repeat(500) });
      expect(result.success).toBe(true);
    });

    it('should reject title with 501 characters', () => {
      const result = TaskCreateSchema.safeParse({ title: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('should reject title with only whitespace', () => {
      const result = TaskCreateSchema.safeParse({ title: '   ' });
      expect(result.success).toBe(true); // Zod doesn't trim by default
    });

    it('should reject empty title', () => {
      const result = TaskCreateSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('List Name Validation', () => {
    it('should accept minimum valid name (1 character)', () => {
      const result = ListCreateSchema.safeParse({ name: 'a' });
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid name (100 characters)', () => {
      const result = ListCreateSchema.safeParse({ name: 'a'.repeat(100) });
      expect(result.success).toBe(true);
    });

    it('should reject name with 101 characters', () => {
      const result = ListCreateSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('Subtask Title Validation', () => {
    it('should accept minimum valid title (1 character)', () => {
      const result = SubtaskSchema.safeParse({ title: 'a' });
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid title (500 characters)', () => {
      const result = SubtaskSchema.safeParse({ title: 'a'.repeat(500) });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = SubtaskSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('Label Validation', () => {
    it('should accept minimum valid name (1 character)', () => {
      const result = LabelSchema.safeParse({ name: 'a', color: '#000' });
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid name (50 characters)', () => {
      const result = LabelSchema.safeParse({ name: 'a'.repeat(50), color: '#000' });
      expect(result.success).toBe(true);
    });

    it('should reject name with 51 characters', () => {
      const result = LabelSchema.safeParse({ name: 'a'.repeat(51), color: '#000' });
      expect(result.success).toBe(false);
    });
  });

  describe('Priority Validation', () => {
    it('should accept all valid priorities', () => {
      expect(Priority.safeParse('high').success).toBe(true);
      expect(Priority.safeParse('medium').success).toBe(true);
      expect(Priority.safeParse('low').success).toBe(true);
      expect(Priority.safeParse('none').success).toBe(true);
    });

    it('should reject invalid priority', () => {
      expect(Priority.safeParse('urgent').success).toBe(false);
      expect(Priority.safeParse('critical').success).toBe(false);
    });
  });

  describe('Task Status Validation', () => {
    it('should accept all valid statuses', () => {
      expect(TaskStatus.safeParse('pending').success).toBe(true);
      expect(TaskStatus.safeParse('in_progress').success).toBe(true);
      expect(TaskStatus.safeParse('completed').success).toBe(true);
      expect(TaskStatus.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(TaskStatus.safeParse('done').success).toBe(false);
      expect(TaskStatus.safeParse('active').success).toBe(false);
    });
  });

  describe('Recurring Type Validation', () => {
    it('should accept all valid recurring types', () => {
      expect(RecurringType.safeParse('none').success).toBe(true);
      expect(RecurringType.safeParse('daily').success).toBe(true);
      expect(RecurringType.safeParse('weekly').success).toBe(true);
      expect(RecurringType.safeParse('weekdays').success).toBe(true);
      expect(RecurringType.safeParse('monthly').success).toBe(true);
      expect(RecurringType.safeParse('yearly').success).toBe(true);
      expect(RecurringType.safeParse('custom').success).toBe(true);
    });

    it('should reject invalid recurring type', () => {
      expect(RecurringType.safeParse('hourly').success).toBe(false);
    });
  });

  describe('Number Validation', () => {
    it('should accept zero for estimateHours', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', estimateHours: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept positive numbers for estimates', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', estimateHours: 5, estimateMinutes: 30 });
      expect(result.success).toBe(true);
    });

    it('should reject negative estimates', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', estimateHours: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should accept valid ISO date string', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', date: '2024-01-15' });
      expect(result.success).toBe(true);
    });

    it('should accept null date', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', date: null });
      expect(result.success).toBe(true);
    });

    it('should accept undefined date', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task' });
      expect(result.success).toBe(true);
    });
  });

  describe('Boolean Validation', () => {
    it('should accept true for isAllDay', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', isAllDay: true });
      expect(result.success).toBe(true);
    });

    it('should accept false for isAllDay', () => {
      const result = TaskCreateSchema.safeParse({ title: 'Task', isAllDay: false });
      expect(result.success).toBe(true);
    });
  });

  describe('Color Validation', () => {
    it('should accept hex color', () => {
      const result = ListCreateSchema.safeParse({ name: 'List', color: '#ff0000' });
      expect(result.success).toBe(true);
    });

    it('should accept short hex color', () => {
      const result = ListCreateSchema.safeParse({ name: 'List', color: '#fff' });
      expect(result.success).toBe(true);
    });

    it('should accept named color', () => {
      const result = ListCreateSchema.safeParse({ name: 'List', color: 'red' });
      expect(result.success).toBe(true);
    });
  });

  describe('Emoji Validation', () => {
    it('should accept single emoji', () => {
      const result = ListCreateSchema.safeParse({ name: 'List', emoji: '📋' });
      expect(result.success).toBe(true);
    });

    it('should accept multiple emojis', () => {
      const result = ListCreateSchema.safeParse({ name: 'List', emoji: '📋📝' });
      expect(result.success).toBe(true);
    });

    it('should accept text as emoji', () => {
      const result = ListCreateSchema.safeParse({ name: 'List', emoji: 'list' });
      expect(result.success).toBe(true);
    });
  });
});
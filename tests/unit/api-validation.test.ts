import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the validation schemas used in the API
const Priority = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
const RecurringType = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);

const TaskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  listId: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  estimateHours: z.number().default(0),
  estimateMinutes: z.number().default(0),
  priority: Priority.default('none'),
  recurringType: RecurringType.default('none'),
  isAllDay: z.boolean().default(false),
});

const TaskUpdateSchema = TaskCreateSchema.partial().and(z.object({
  id: z.string().min(1),
}));

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

describe('API Request Validation', () => {
  describe('Task Creation', () => {
    it('should validate valid task creation request', () => {
      const validRequest = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
      };

      const result = TaskCreateSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject task without title', () => {
      const invalidRequest = {
        description: 'Task description',
      };

      const result = TaskCreateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject task with empty title', () => {
      const invalidRequest = {
        title: '',
      };

      const result = TaskCreateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject task with too long title', () => {
      const invalidRequest = {
        title: 'a'.repeat(501),
      };

      const result = TaskCreateSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalRequest = {
        title: 'Task',
      };

      const result = TaskCreateSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('none');
        expect(result.data.description).toBe('');
        expect(result.data.isAllDay).toBe(false);
      }
    });
  });

  describe('Task Update', () => {
    it('should validate partial updates', () => {
      const result = TaskUpdateSchema.safeParse({
        id: 'task-123',
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should require id for update', () => {
      const result = TaskUpdateSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('List Creation', () => {
    it('should validate valid list creation', () => {
      const result = ListCreateSchema.safeParse({
        name: 'My List',
        color: '#ff0000',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should reject list without name', () => {
      const result = ListCreateSchema.safeParse({
        color: '#ff0000',
      });
      expect(result.success).toBe(false);
    });

    it('should apply default color and emoji', () => {
      const result = ListCreateSchema.safeParse({
        name: 'My List',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3b82f6');
        expect(result.data.emoji).toBe('📋');
      }
    });
  });

  describe('Subtask Creation', () => {
    it('should validate subtask creation', () => {
      const result = SubtaskSchema.safeParse({
        title: 'New subtask',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty subtask title', () => {
      const result = SubtaskSchema.safeParse({
        title: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Label Creation', () => {
    it('should validate label creation', () => {
      const result = LabelSchema.safeParse({
        name: 'Work',
        color: '#ff0000',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default icon', () => {
      const result = LabelSchema.safeParse({
        name: 'Work',
        color: '#ff0000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon).toBe('🏷');
      }
    });
  });

  describe('Query Parameters', () => {
    it('should validate view parameter', () => {
      const validViews = ['today', 'next7', 'upcoming', 'all'];
      const isValidView = (view: string): boolean => validViews.includes(view);

      expect(isValidView('today')).toBe(true);
      expect(isValidView('all')).toBe(true);
      expect(isValidView('invalid')).toBe(false);
    });

    it('should validate listId parameter', () => {
      const isValidListId = (id: string): boolean => id.length > 0;

      expect(isValidListId('list-123')).toBe(true);
      expect(isValidListId('')).toBe(false);
    });
  });
});
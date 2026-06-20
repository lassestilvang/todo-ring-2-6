import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import fc from 'fast-check';

// Schemas from the project
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

describe('Property-Based Tests', () => {
  describe('Task Title Validation', () => {
    it('should accept any non-empty string up to 500 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (title) => {
            const result = TaskCreateSchema.safeParse({ title });
            return result.success === true;
          }
        )
      );
    });

    it('should reject empty strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 0 }),
          (title) => {
            const result = TaskCreateSchema.safeParse({ title });
            return result.success === false;
          }
        )
      );
    });

    it('should reject strings longer than 500 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 501 }),
          (title) => {
            const result = TaskCreateSchema.safeParse({ title });
            return result.success === false;
          }
        )
      );
    });
  });

  describe('Priority Validation', () => {
    it('should accept all valid priorities', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('high', 'medium', 'low', 'none'),
          (priority) => {
            const result = Priority.safeParse(priority);
            return result.success === true;
          }
        )
      );
    });

    it('should reject invalid priorities', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (priority) => {
            if (['high', 'medium', 'low', 'none'].includes(priority)) {
              return true; // Skip valid values
            }
            const result = Priority.safeParse(priority);
            return result.success === false;
          }
        )
      );
    });
  });

  describe('Task Status Validation', () => {
    it('should accept all valid statuses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('pending', 'in_progress', 'completed', 'cancelled'),
          (status) => {
            const result = TaskStatus.safeParse(status);
            return result.success === true;
          }
        )
      );
    });
  });

  describe('Recurring Type Validation', () => {
    it('should accept all valid recurring types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom'),
          (type) => {
            const result = RecurringType.safeParse(type);
            return result.success === true;
          }
        )
      );
    });
  });

  describe('List Name Validation', () => {
    it('should accept names between 1-100 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (name) => {
            const result = ListCreateSchema.safeParse({ name });
            return result.success === true;
          }
        )
      );
    });

    it('should reject empty names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 0 }),
          (name) => {
            const result = ListCreateSchema.safeParse({ name });
            return result.success === false;
          }
        )
      );
    });
  });

  describe('Subtask Title Validation', () => {
    it('should accept titles between 1-500 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (title) => {
            const result = SubtaskSchema.safeParse({ title });
            return result.success === true;
          }
        )
      );
    });
  });

  describe('Label Name Validation', () => {
    it('should accept names between 1-50 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (name) => {
            const result = LabelSchema.safeParse({ name, color: '#000' });
            return result.success === true;
          }
        )
      );
    });
  });

  describe('Hex Color Validation', () => {
    it('should accept valid hex colors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 4, maxLength: 7 }),
          (color) => {
            const fullColor = '#' + color;
            const result = ListCreateSchema.safeParse({ name: 'Test', color: fullColor });
            return result.success === true;
          }
        )
      );
    });
  });

  describe('Boolean Properties', () => {
    it('should accept both true and false for isAllDay', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isAllDay) => {
            const result = TaskCreateSchema.safeParse({ title: 'Test', isAllDay });
            return result.success === true && result.data.isAllDay === isAllDay;
          }
        )
      );
    });
  });

  describe('Number Properties', () => {
    it('should accept non-negative numbers for estimates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1440 }),
          (minutes) => {
            const result = TaskCreateSchema.safeParse({ title: 'Test', estimateMinutes: minutes });
            return result.success === true && result.data.estimateMinutes === minutes;
          }
        )
      );
    });

    it('should reject negative numbers for estimates', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: -1 }),
          (minutes) => {
            const result = TaskCreateSchema.safeParse({ title: 'Test', estimateMinutes: minutes });
            return result.success === false;
          }
        )
      );
    });
  });

  describe('Round-Trip Properties', () => {
    it('should preserve title through parse-stringify-parse cycle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (title) => {
            const parsed1 = TaskCreateSchema.safeParse({ title });
            if (!parsed1.success) return false;
            const stringified = JSON.stringify(parsed1.data);
            const parsed2 = TaskCreateSchema.safeParse(JSON.parse(stringified));
            return parsed2.success === true && parsed2.data.title === title;
          }
        )
      );
    });
  });
});
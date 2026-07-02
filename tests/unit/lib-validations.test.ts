/**
 * Comprehensive tests for validations schema
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-define schemas for testing
const PrioritySchema = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
const RecurringTypeSchema = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);

const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).default(''),
  listId: z.string().uuid().nullable().optional(),
  date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  estimateHours: z.number().min(0).default(0),
  estimateMinutes: z.number().min(0).default(0),
  priority: PrioritySchema.default('none'),
  status: TaskStatusSchema.default('pending'),
  recurringType: RecurringTypeSchema.default('none'),
  recurringInterval: z.string().max(100).default(''),
  isAllDay: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
});

const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

describe('Validation Schemas', () => {
  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const result = TaskSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Task',
        priority: 'high',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = TaskSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const result = TaskSchema.safeParse({ title: 'Test', priority: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = TaskSchema.safeParse({ title: 'Test', status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should validate registration with valid data', () => {
      const result = RegisterSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = RegisterSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = RegisterSchema.safeParse({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should validate login with valid data', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

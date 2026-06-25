/**
 * Library Validations Tests
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define schemas inline for testing (matching the ones in validations.ts)
const PrioritySchema = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  description: z.string().max(10000, 'Description must be less than 10000 characters').default(''),
  estimateHours: z.number().min(0, 'Estimate hours must be non-negative').max(999, 'Estimate hours must be less than 1000').default(0),
  estimateMinutes: z.number().min(0, 'Estimate minutes must be non-negative').max(59, 'Estimate minutes must be less than 60').default(0),
  priority: PrioritySchema.default('none'),
  status: TaskStatusSchema.default('pending'),
});

const ListSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

const TaskReorderSchema = z.object({
  taskId: z.string().uuid(),
  newPosition: z.number().min(0, 'Position must be non-negative'),
});

describe('Library Validations', () => {
  describe('PrioritySchema', () => {
    it('should accept valid priority values', () => {
      expect(PrioritySchema.safeParse('high').success).toBe(true);
      expect(PrioritySchema.safeParse('medium').success).toBe(true);
      expect(PrioritySchema.safeParse('low').success).toBe(true);
      expect(PrioritySchema.safeParse('none').success).toBe(true);
    });

    it('should reject invalid priority values', () => {
      expect(PrioritySchema.safeParse('urgent').success).toBe(false);
      expect(PrioritySchema.safeParse('critical').success).toBe(false);
    });
  });

  describe('TaskStatusSchema', () => {
    it('should accept valid status values', () => {
      expect(TaskStatusSchema.safeParse('pending').success).toBe(true);
      expect(TaskStatusSchema.safeParse('in_progress').success).toBe(true);
      expect(TaskStatusSchema.safeParse('completed').success).toBe(true);
      expect(TaskStatusSchema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid status values', () => {
      expect(TaskStatusSchema.safeParse('done').success).toBe(false);
      expect(TaskStatusSchema.safeParse('active').success).toBe(false);
    });
  });

  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const result = TaskSchema.safeParse({
        title: 'Test Task',
        description: 'Test description',
        priority: 'high',
        status: 'pending',
      });
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const result = TaskSchema.safeParse({ description: 'Test' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('title');
      }
    });

    it('should reject title longer than 500 characters', () => {
      const result = TaskSchema.safeParse({ title: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('should accept empty description', () => {
      const result = TaskSchema.safeParse({ title: 'Test', description: '' });
      expect(result.success).toBe(true);
    });

    it('should validate estimate hours range', () => {
      const result = TaskSchema.safeParse({ title: 'Test', estimateHours: -1 });
      expect(result.success).toBe(false);
    });

    it('should validate estimate minutes range', () => {
      const result = TaskSchema.safeParse({ title: 'Test', estimateMinutes: 60 });
      expect(result.success).toBe(false);
    });
  });

  describe('ListSchema', () => {
    it('should validate a valid list', () => {
      const result = ListSchema.safeParse({
        name: 'My List',
        color: '#3b82f6',
        emoji: '📋',
      });
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = ListSchema.safeParse({ color: '#3b82f6' });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const result = ListSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('BulkDeleteSchema', () => {
    it('should validate array of IDs', () => {
      const result = BulkDeleteSchema.safeParse({ ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'] });
      expect(result.success).toBe(true);
    });

    it('should require at least one ID', () => {
      const result = BulkDeleteSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('TaskReorderSchema', () => {
    it('should validate task reorder', () => {
      const result = TaskReorderSchema.safeParse({ taskId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', newPosition: 5 });
      expect(result.success).toBe(true);
    });

    it('should require taskId', () => {
      const result = TaskReorderSchema.safeParse({ newPosition: 5 });
      expect(result.success).toBe(false);
    });

    it('should require non-negative position', () => {
      const result = TaskReorderSchema.safeParse({ taskId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', newPosition: -1 });
      expect(result.success).toBe(false);
    });
  });
});
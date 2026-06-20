import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  TaskSchema,
  ListSchema,
  SubtaskSchema,
  LabelSchema,
  ReminderSchema,
} from '../../src/lib/validations';

describe('Validation Schemas - Comprehensive', () => {
  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const task = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high',
        status: 'pending',
      };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const task = { title: '' };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject title over 500 characters', () => {
      const task = { title: 'a'.repeat(501) };
      const result = TaskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should validate priority enum', () => {
      expect(TaskSchema.safeParse({ title: 'test', priority: 'high' }).success).toBe(true);
      expect(TaskSchema.safeParse({ title: 'test', priority: 'invalid' }).success).toBe(false);
    });

    it('should validate status enum', () => {
      expect(TaskSchema.safeParse({ title: 'test', status: 'completed' }).success).toBe(true);
      expect(TaskSchema.safeParse({ title: 'test', status: 'invalid' }).success).toBe(false);
    });
  });

  describe('ListSchema', () => {
    it('should validate a valid list', () => {
      const list = {
        name: 'My List',
        color: '#3b82f6',
        emoji: '📋',
      };
      const result = ListSchema.safeParse(list);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = ListSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const result = ListSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('SubtaskSchema', () => {
    it('should validate a valid subtask', () => {
      const subtask = {
        taskId: '11111111-1111-1111-1111-111111111111',
        title: 'Subtask item',
      };
      const result = SubtaskSchema.safeParse(subtask);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = SubtaskSchema.safeParse({ taskId: '11111111-1111-1111-1111-111111111111', title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('LabelSchema', () => {
    it('should validate a valid label', () => {
      const label = {
        name: 'Important',
        color: '#ef4444',
        icon: '🔥',
      };
      const result = LabelSchema.safeParse(label);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = LabelSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('ReminderSchema', () => {
    it('should validate a valid reminder', () => {
      const reminder = {
        taskId: '11111111-1111-1111-1111-111111111111',
        remindAt: '2024-12-31T10:00:00Z',
      };
      const result = ReminderSchema.safeParse(reminder);
      expect(result.success).toBe(true);
    });

    it('should default method to notification', () => {
      const reminder = {
        taskId: '11111111-1111-1111-1111-111111111111',
        remindAt: '2024-12-31T10:00:00Z',
      };
      const result = ReminderSchema.safeParse(reminder);
      expect(result.success).toBe(true);
      expect(result.data?.method).toBe('notification');
    });
  });
});
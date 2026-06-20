import { describe, it, expect } from 'vitest';
import {
  Priority,
  RecurringType,
  TaskStatus,
  ListSchema,
  TaskSchema,
  SubtaskSchema,
  LabelSchema,
} from '../../src/types/index';
import { z } from 'zod';

describe('Type Validation Schemas', () => {
  describe('Priority', () => {
    it('should validate high priority', () => {
      expect(Priority.safeParse('high').success).toBe(true);
    });

    it('should validate medium priority', () => {
      expect(Priority.safeParse('medium').success).toBe(true);
    });

    it('should validate low priority', () => {
      expect(Priority.safeParse('low').success).toBe(true);
    });

    it('should validate none priority', () => {
      expect(Priority.safeParse('none').success).toBe(true);
    });

    it('should reject invalid priority', () => {
      expect(Priority.safeParse('urgent').success).toBe(false);
    });
  });

  describe('TaskStatus', () => {
    it('should validate pending status', () => {
      expect(TaskStatus.safeParse('pending').success).toBe(true);
    });

    it('should validate completed status', () => {
      expect(TaskStatus.safeParse('completed').success).toBe(true);
    });

    it('should validate in_progress status', () => {
      expect(TaskStatus.safeParse('in_progress').success).toBe(true);
    });

    it('should validate cancelled status', () => {
      expect(TaskStatus.safeParse('cancelled').success).toBe(true);
    });
  });

  describe('RecurringType', () => {
    it('should validate daily', () => {
      expect(RecurringType.safeParse('daily').success).toBe(true);
    });

    it('should validate weekly', () => {
      expect(RecurringType.safeParse('weekly').success).toBe(true);
    });

    it('should validate monthly', () => {
      expect(RecurringType.safeParse('monthly').success).toBe(true);
    });

    it('should validate yearly', () => {
      expect(RecurringType.safeParse('yearly').success).toBe(true);
    });
  });

  describe('ListSchema', () => {
    it('should validate a valid list', () => {
      const result = ListSchema.safeParse({
        id: 'list-123',
        name: 'My List',
        color: '#3b82f6',
        emoji: '📋',
        isInbox: false,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default color', () => {
      const result = ListSchema.safeParse({
        id: 'list-123',
        name: 'My List',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3b82f6');
      }
    });
  });

  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const result = TaskSchema.safeParse({
        id: 'task-123',
        title: 'My Task',
        description: 'Description',
        listId: 'list-123',
        priority: 'high',
        status: 'pending',
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject task with empty title', () => {
      const result = TaskSchema.safeParse({
        id: 'task-123',
        title: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const result = TaskSchema.safeParse({
        id: 'task-123',
        title: 'Task',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('none');
        expect(result.data.status).toBe('pending');
        expect(result.data.description).toBe('');
      }
    });
  });

  describe('SubtaskSchema', () => {
    it('should validate a valid subtask', () => {
      const result = SubtaskSchema.safeParse({
        id: 'sub-123',
        taskId: 'task-123',
        title: 'Subtask',
        isCompleted: false,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('LabelSchema', () => {
    it('should validate a valid label', () => {
      const result = LabelSchema.safeParse({
        id: 'label-123',
        name: 'Work',
        color: '#ff0000',
        icon: '💼',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default icon', () => {
      const result = LabelSchema.safeParse({
        id: 'label-123',
        name: 'Work',
        color: '#ff0000',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon).toBe('🏷');
      }
    });
  });
});
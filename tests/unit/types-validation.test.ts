/**
 * Comprehensive validation tests for type schemas
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate all schemas from src/types/index.ts
const Priority = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
const RecurringType = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);

const ListSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
  isInbox: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  listId: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  reminderTime: z.string().nullable().optional(),
  estimateHours: z.number().default(0),
  estimateMinutes: z.number().default(0),
  actualHours: z.number().default(0),
  actualMinutes: z.number().default(0),
  priority: Priority.default('none'),
  status: TaskStatus.default('pending'),
  recurringType: RecurringType.default('none'),
  recurringInterval: z.string().default(''),
  isAllDay: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SubtaskSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  title: z.string().min(1).max(500),
  isCompleted: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
});

const LabelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  color: z.string(),
  icon: z.string().default('🏷'),
  createdAt: z.string(),
});

const TaskLabelSchema = z.object({
  taskId: z.string(),
  labelId: z.string(),
});

const TaskHistorySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  action: z.string(),
  fieldChanged: z.string().nullable().optional(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  performedAt: z.string(),
});

const ReminderSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  remindAt: z.string(),
  method: z.enum(['notification', 'email']).default('notification'),
  isFired: z.boolean().default(false),
});

const AttachmentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  filename: z.string(),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  filePath: z.string().nullable().optional(),
  createdAt: z.string(),
});

const TaskDependencySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  dependsOnId: z.string(),
  createdAt: z.string(),
});

const TaskShareSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string(),
});

const ListShareSchema = z.object({
  id: z.string(),
  listId: z.string(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string(),
});

const TaskCommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  userName: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

describe('Type Validation Schemas', () => {
  describe('Priority', () => {
    it('should validate high priority', () => {
      expect(Priority.parse('high')).toBe('high');
    });

    it('should validate medium priority', () => {
      expect(Priority.parse('medium')).toBe('medium');
    });

    it('should validate low priority', () => {
      expect(Priority.parse('low')).toBe('low');
    });

    it('should validate none priority', () => {
      expect(Priority.parse('none')).toBe('none');
    });

    it('should reject invalid priority', () => {
      expect(() => Priority.parse('urgent')).toThrow();
    });
  });

  describe('TaskStatus', () => {
    it('should validate pending status', () => {
      expect(TaskStatus.parse('pending')).toBe('pending');
    });

    it('should validate in_progress status', () => {
      expect(TaskStatus.parse('in_progress')).toBe('in_progress');
    });

    it('should validate completed status', () => {
      expect(TaskStatus.parse('completed')).toBe('completed');
    });

    it('should validate cancelled status', () => {
      expect(TaskStatus.parse('cancelled')).toBe('cancelled');
    });
  });

  describe('RecurringType', () => {
    it('should validate daily', () => {
      expect(RecurringType.parse('daily')).toBe('daily');
    });

    it('should validate weekly', () => {
      expect(RecurringType.parse('weekly')).toBe('weekly');
    });

    it('should validate monthly', () => {
      expect(RecurringType.parse('monthly')).toBe('monthly');
    });

    it('should validate yearly', () => {
      expect(RecurringType.parse('yearly')).toBe('yearly');
    });
  });

  describe('ListSchema', () => {
    it('should validate a valid list', () => {
      const list = ListSchema.parse({
        id: 'list-1',
        name: 'My List',
        color: '#3b82f6',
        emoji: '📋',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(list.name).toBe('My List');
    });

    it('should apply default color', () => {
      const list = ListSchema.parse({
        id: 'list-1',
        name: 'My List',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(list.color).toBe('#3b82f6');
    });

    it('should apply default emoji', () => {
      const list = ListSchema.parse({
        id: 'list-1',
        name: 'My List',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(list.emoji).toBe('📋');
    });

    it('should reject empty name', () => {
      expect(() => ListSchema.parse({
        id: 'list-1',
        name: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })).toThrow();
    });

    it('should reject name over 100 characters', () => {
      expect(() => ListSchema.parse({
        id: 'list-1',
        name: 'a'.repeat(101),
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })).toThrow();
    });
  });

  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const task = TaskSchema.parse({
        id: 'task-1',
        title: 'My Task',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(task.title).toBe('My Task');
    });

    it('should reject task with empty title', () => {
      expect(() => TaskSchema.parse({
        id: 'task-1',
        title: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })).toThrow();
    });

    it('should apply default values', () => {
      const task = TaskSchema.parse({
        id: 'task-1',
        title: 'My Task',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(task.priority).toBe('none');
      expect(task.status).toBe('pending');
      expect(task.recurringType).toBe('none');
    });
  });

  describe('SubtaskSchema', () => {
    it('should validate a valid subtask', () => {
      const subtask = SubtaskSchema.parse({
        id: 'subtask-1',
        taskId: 'task-1',
        title: 'My Subtask',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(subtask.title).toBe('My Subtask');
    });

    it('should apply default isCompleted', () => {
      const subtask = SubtaskSchema.parse({
        id: 'subtask-1',
        taskId: 'task-1',
        title: 'My Subtask',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(subtask.isCompleted).toBe(false);
    });
  });

  describe('LabelSchema', () => {
    it('should validate a valid label', () => {
      const label = LabelSchema.parse({
        id: 'label-1',
        name: 'Work',
        color: '#ff0000',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(label.name).toBe('Work');
    });

    it('should apply default icon', () => {
      const label = LabelSchema.parse({
        id: 'label-1',
        name: 'Work',
        color: '#ff0000',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(label.icon).toBe('🏷');
    });
  });

  describe('TaskHistorySchema', () => {
    it('should validate task history', () => {
      const history = TaskHistorySchema.parse({
        id: 'history-1',
        taskId: 'task-1',
        action: 'created',
        performedAt: '2024-01-01T00:00:00Z',
      });
      expect(history.action).toBe('created');
    });
  });

  describe('TaskShareSchema', () => {
    it('should validate viewer role', () => {
      const share = TaskShareSchema.parse({
        id: 'share-1',
        taskId: 'task-1',
        userId: 'user-1',
        userName: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(share.role).toBe('viewer');
    });

    it('should validate editor role', () => {
      const share = TaskShareSchema.parse({
        id: 'share-1',
        taskId: 'task-1',
        userId: 'user-1',
        userName: 'Test User',
        role: 'editor',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(share.role).toBe('editor');
    });

    it('should validate admin role', () => {
      const share = TaskShareSchema.parse({
        id: 'share-1',
        taskId: 'task-1',
        userId: 'user-1',
        userName: 'Test User',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(share.role).toBe('admin');
    });
  });
});
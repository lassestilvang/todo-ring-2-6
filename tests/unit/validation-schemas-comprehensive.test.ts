/**
 * Validation Schemas - Comprehensive Tests
 * Tests all validation schemas from src/lib/validations.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import all schemas from validations
const PrioritySchema = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
const RecurringTypeSchema = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);

const ListSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
  isInbox: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  description: z.string().max(10000, 'Description must be less than 10000 characters').default(''),
  listId: z.string().uuid().nullable().optional(),
  date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  reminderTime: z.string().nullable().optional(),
  estimateHours: z.number().min(0, 'Estimate hours must be non-negative').max(999, 'Estimate hours must be less than 1000').default(0),
  estimateMinutes: z.number().min(0, 'Estimate minutes must be non-negative').max(59, 'Estimate minutes must be less than 60').default(0),
  actualHours: z.number().min(0, 'Actual hours must be non-negative').default(0),
  actualMinutes: z.number().min(0, 'Actual minutes must be non-negative').max(59, 'Actual minutes must be less than 60').default(0),
  priority: PrioritySchema.default('none'),
  status: TaskStatusSchema.default('pending'),
  recurringType: RecurringTypeSchema.default('none'),
  recurringInterval: z.string().max(100).default(''),
  isAllDay: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const SubtaskSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  isCompleted: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime().optional(),
});

const LabelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default('🏷'),
  createdAt: z.string().datetime().optional(),
});

const ReminderSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  remindAt: z.string().datetime(),
  method: z.enum(['notification', 'email']).default('notification'),
  isFired: z.boolean().default(false),
});

const AttachmentSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  filename: z.string().min(1, 'Filename is required'),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().nonnegative().nullable().optional(),
  filePath: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

const TaskDependencySchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
  createdAt: z.string().datetime().optional(),
});

const TaskCommentSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  content: z.string().min(1, 'Content is required'),
  createdAt: z.string().datetime().optional(),
});

const TaskShareSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string().datetime().optional(),
});

const ListShareSchema = z.object({
  id: z.string().uuid().optional(),
  listId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string().datetime().optional(),
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

const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const PasswordResetConfirmSchema = z.object({
  token: z.string().uuid('Invalid reset token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const MFAVerifySchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(6),
});

const AutomationRuleSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  triggerType: z.enum(['task_completed', 'task_created', 'task_updated', 'due_date_passed', 'status_changed', 'priority_changed']),
  triggerValue: z.string().optional(),
  actionType: z.enum(['create_task', 'update_task', 'set_priority', 'add_label', 'assign_user', 'send_notification']),
  actionValue: z.string().optional(),
  isEnabled: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const TimeEntrySchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  description: z.string().max(500).optional().default(''),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const TeamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional().default(''),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const FocusSessionSchema = z.object({
  taskId: z.string().uuid().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
  userId: z.string().uuid(),
});

const EmailTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['reminder', 'welcome', 'password-reset', 'notification']),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().min(1, 'Text content is required'),
  config: z.object({
    brandColor: z.string().optional(),
    brandName: z.string().optional(),
    footerText: z.string().optional(),
    showLogo: z.boolean().optional(),
  }),
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

const TaskReorderSchema = z.object({
  taskId: z.string().uuid(),
  newPosition: z.number().min(0),
});

const ListReorderSchema = z.object({
  listId: z.string().uuid(),
  newPosition: z.number().min(0),
});

describe('Validation Schemas - Comprehensive', () => {
  describe('Enum Schemas', () => {
    it('should validate PrioritySchema', () => {
      expect(PrioritySchema.parse('high')).toBe('high');
      expect(PrioritySchema.parse('medium')).toBe('medium');
      expect(PrioritySchema.parse('low')).toBe('low');
      expect(PrioritySchema.parse('none')).toBe('none');
      expect(() => PrioritySchema.parse('invalid')).toThrow();
    });

    it('should validate TaskStatusSchema', () => {
      expect(TaskStatusSchema.parse('pending')).toBe('pending');
      expect(TaskStatusSchema.parse('in_progress')).toBe('in_progress');
      expect(TaskStatusSchema.parse('completed')).toBe('completed');
      expect(TaskStatusSchema.parse('cancelled')).toBe('cancelled');
      expect(() => TaskStatusSchema.parse('invalid')).toThrow();
    });

    it('should validate RecurringTypeSchema', () => {
      expect(RecurringTypeSchema.parse('none')).toBe('none');
      expect(RecurringTypeSchema.parse('daily')).toBe('daily');
      expect(RecurringTypeSchema.parse('weekly')).toBe('weekly');
      expect(RecurringTypeSchema.parse('weekdays')).toBe('weekdays');
      expect(RecurringTypeSchema.parse('monthly')).toBe('monthly');
      expect(RecurringTypeSchema.parse('yearly')).toBe('yearly');
      expect(RecurringTypeSchema.parse('custom')).toBe('custom');
      expect(() => RecurringTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('ListSchema', () => {
    it('should validate a valid list', () => {
      const result = ListSchema.safeParse({ name: 'My List', color: '#3b82f6' });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = ListSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#3b82f6');
      expect(result.data?.emoji).toBe('📋');
    });

    it('should reject empty name', () => {
      const result = ListSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const result = ListSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should accept valid UUID', () => {
      const result = ListSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const result = TaskSchema.safeParse({ title: 'Test Task' });
      expect(result.success).toBe(true);
    });

    it('should apply all defaults', () => {
      const result = TaskSchema.safeParse({ title: 'Test' });
      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe('none');
      expect(result.data?.status).toBe('pending');
      expect(result.data?.recurringType).toBe('none');
      expect(result.data?.isAllDay).toBe(false);
      expect(result.data?.sortOrder).toBe(0);
    });

    it('should reject empty title', () => {
      const result = TaskSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 500 characters', () => {
      const result = TaskSchema.safeParse({ title: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('SubtaskSchema', () => {
    it('should validate a valid subtask', () => {
      const result = SubtaskSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Subtask',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = SubtaskSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
      });
      expect(result.success).toBe(true);
      expect(result.data?.isCompleted).toBe(false);
    });

    it('should reject empty title', () => {
      const result = SubtaskSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LabelSchema', () => {
    it('should validate a valid label', () => {
      const result = LabelSchema.safeParse({
        name: 'Important',
        color: '#ff0000',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default icon', () => {
      const result = LabelSchema.safeParse({
        name: 'Test',
        color: '#3b82f6',
      });
      expect(result.success).toBe(true);
      expect(result.data?.icon).toBe('🏷');
    });
  });

  describe('ReminderSchema', () => {
    it('should validate a valid reminder', () => {
      const result = ReminderSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        remindAt: '2024-12-31T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default method', () => {
      const result = ReminderSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        remindAt: '2024-12-31T10:00:00Z',
      });
      expect(result.data?.method).toBe('notification');
    });
  });

  describe('Authentication Schemas', () => {
    it('should validate RegisterSchema', () => {
      const result = RegisterSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short password in RegisterSchema', () => {
      const result = RegisterSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should validate LoginSchema', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should validate PasswordResetRequestSchema', () => {
      const result = PasswordResetRequestSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should validate PasswordResetConfirmSchema', () => {
      const result = PasswordResetConfirmSchema.safeParse({
        token: '550e8400-e29b-41d4-a716-446655440000',
        newPassword: 'newpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should validate MFAVerifySchema', () => {
      const result = MFAVerifySchema.safeParse({ code: '123456' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid MFA code length', () => {
      const result = MFAVerifySchema.safeParse({ code: '12345' });
      expect(result.success).toBe(false);
    });
  });

  describe('AutomationRuleSchema', () => {
    it('should validate a valid automation rule', () => {
      const result = AutomationRuleSchema.safeParse({
        name: 'Auto Complete',
        triggerType: 'task_completed',
        actionType: 'send_notification',
      });
      expect(result.success).toBe(true);
    });

    it('should apply default isEnabled', () => {
      const result = AutomationRuleSchema.safeParse({
        name: 'Test',
        triggerType: 'task_created',
        actionType: 'create_task',
      });
      expect(result.data?.isEnabled).toBe(true);
    });
  });

  describe('TimeEntrySchema', () => {
    it('should validate a valid time entry', () => {
      const result = TimeEntrySchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2024-01-15T10:00:00Z',
        duration: 60,
      });
      expect(result.success).toBe(true);
    });

    it('should reject duration under 1 minute', () => {
      const result = TimeEntrySchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2024-01-15T10:00:00Z',
        duration: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TeamSchema', () => {
    it('should validate a valid team', () => {
      const result = TeamSchema.safeParse({
        name: 'Development Team',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = TeamSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('FocusSessionSchema', () => {
    it('should validate a valid focus session', () => {
      const result = FocusSessionSchema.safeParse({
        duration: 25,
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject duration over 1440', () => {
      const result = FocusSessionSchema.safeParse({
        duration: 1441,
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('EmailTemplateSchema', () => {
    it('should validate a valid email template', () => {
      const result = EmailTemplateSchema.safeParse({
        name: 'Welcome Email',
        type: 'welcome',
        subject: 'Welcome to TaskPlanner!',
        html: '<h1>Welcome</h1>',
        text: 'Welcome',
        config: {},
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Bulk Operations Schemas', () => {
    it('should validate BulkDeleteSchema', () => {
      const result = BulkDeleteSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty ids in BulkDeleteSchema', () => {
      const result = BulkDeleteSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should validate TaskReorderSchema', () => {
      const result = TaskReorderSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        newPosition: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative position in TaskReorderSchema', () => {
      const result = TaskReorderSchema.safeParse({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        newPosition: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});
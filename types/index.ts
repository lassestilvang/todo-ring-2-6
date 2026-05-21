import { z } from 'zod';

// === Type Definitions ===

export const Priority = z.enum(['high', 'medium', 'low', 'none']);
export type Priority = z.infer<typeof Priority>;

export const RecurringType = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);
export type RecurringType = z.infer<typeof RecurringType>;

export const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const ListSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
  isInbox: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  listId: z.string().nullable().optional(),
  date: z.string().nullable().optional(), // YYYY-MM-DD
  deadline: z.string().nullable().optional(), // YYYY-MM-DD
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

export const SubtaskSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  title: z.string().min(1).max(500),
  isCompleted: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
});

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  color: z.string(),
  icon: z.string().default('🏷'),
  createdAt: z.string(),
});

export const TaskLabelSchema = z.object({
  taskId: z.string(),
  labelId: z.string(),
});

export const TaskHistorySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  action: z.string(),
  fieldChanged: z.string().nullable().optional(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  performedAt: z.string(),
});

export const ReminderSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  remindAt: z.string(),
  method: z.enum(['notification', 'email']).default('notification'),
  isFired: z.boolean().default(false),
});

export const AttachmentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  filename: z.string(),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  filePath: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type List = z.infer<typeof ListSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Label = z.infer<typeof LabelSchema>;
export type TaskLabel = z.infer<typeof TaskLabelSchema>;
export type TaskHistory = z.infer<typeof TaskHistorySchema>;
export type Reminder = z.infer<typeof ReminderSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
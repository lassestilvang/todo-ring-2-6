import { z } from 'zod';

// Priority enum
export const PrioritySchema = z.enum(['high', 'medium', 'low', 'none']);
export type Priority = z.infer<typeof PrioritySchema>;

// Task Status enum
export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Recurring Type enum
export const RecurringTypeSchema = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);
export type RecurringType = z.infer<typeof RecurringTypeSchema>;

// List Schema
export const ListSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
  isInbox: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Task Schemas
export const TaskSchema = z.object({
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

// Subtask Schema
export const SubtaskSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  isCompleted: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime().optional(),
});

// Label Schema
export const LabelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default('🏷'),
  createdAt: z.string().datetime().optional(),
});

// Task-Label Schema
export const TaskLabelSchema = z.object({
  taskId: z.string().uuid(),
  labelId: z.string().uuid(),
});

// Reminder Schema
export const ReminderSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  remindAt: z.string().datetime(),
  method: z.enum(['notification', 'email']).default('notification'),
  isFired: z.boolean().default(false),
});

// Attachment Schema
export const AttachmentSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  filename: z.string().min(1, 'Filename is required'),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().nonnegative().nullable().optional(),
  filePath: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

// Task Dependency Schema
export const TaskDependencySchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
  createdAt: z.string().datetime().optional(),
});

// Task Comment Schema
export const TaskCommentSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  content: z.string().min(1, 'Content is required'),
  createdAt: z.string().datetime().optional(),
});

// Task Share Schema
export const TaskShareSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string().datetime().optional(),
});

// List Share Schema
export const ListShareSchema = z.object({
  id: z.string().uuid().optional(),
  listId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string().datetime().optional(),
});

// Task Template Schema
export const TaskTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default('📋'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  priority: PrioritySchema.default('none'),
  estimateHours: z.number().min(0).default(0),
  estimateMinutes: z.number().min(0).max(59).default(0),
  isAllDay: z.boolean().default(false),
  recurringType: RecurringTypeSchema.default('none'),
  recurringInterval: z.string().default(''),
  labelIds: z.array(z.string().uuid()).default([]),
  category: z.string().default('general'),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  usageCount: z.number().default(0),
});

// Bulk Delete Schema
export const BulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

// Task Reorder Schema
export const TaskReorderSchema = z.object({
  taskId: z.string().uuid(),
  newPosition: z.number().min(0),
});

// List Reorder Schema
export const ListReorderSchema = z.object({
  listId: z.string().uuid(),
  newPosition: z.number().min(0),
});

// Import Data Schema
export const ImportDataSchema = z.object({
  version: z.string().optional(),
  lists: z.array(z.object({
    name: z.string().min(1),
    color: z.string().optional(),
    emoji: z.string().optional(),
  })).optional(),
  labels: z.array(z.object({
    name: z.string().min(1),
    color: z.string().min(1),
    icon: z.string().optional(),
  })).optional(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    listId: z.string().optional(),
    date: z.string().optional(),
    deadline: z.string().optional(),
    estimateHours: z.number().optional(),
    estimateMinutes: z.number().optional(),
    priority: z.enum(['high', 'medium', 'low', 'none']).optional(),
    recurringType: z.string().optional(),
    recurringInterval: z.string().optional(),
    isAllDay: z.boolean().optional(),
  })).optional(),
});

// Task Reminder Schema (for creating reminders)
export const TaskReminderSchema = z.object({
  taskId: z.string().uuid(),
  remindAt: z.string().datetime(),
  method: z.enum(['notification', 'email']).default('notification'),
  snoozeMinutes: z.number().min(1).optional(),
});

// Saved View Schema
export const SavedViewSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  icon: z.string().default('🔍'),
  filters: z.record(z.any()).default({}),
});

// Theme Schema
export const ThemeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  colors: z.object({
    primary: z.string().min(1, 'Primary color is required'),
    secondary: z.string().min(1, 'Secondary color is required'),
    accent: z.string().min(1, 'Accent color is required'),
    background: z.string().min(1, 'Background color is required'),
    card: z.string().min(1, 'Card color is required'),
    text: z.string().min(1, 'Text color is required'),
    muted: z.string().min(1, 'Muted color is required'),
    border: z.string().min(1, 'Border color is required'),
  }),
  emoji: z.string().default('🎨'),
});

// Natural Language Parse Result
export interface NaturalLanguageParseResult {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
}

// Register Schema
export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Login Schema
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Password Reset Request Schema
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Password Reset Confirm Schema
export const PasswordResetConfirmSchema = z.object({
  token: z.string().uuid('Invalid reset token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// MFA Verification Schema
export const MFAVerifySchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(6),
});

// Automation Rule Schema
export const AutomationRuleSchema = z.object({
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

// Custom Field Schema
export const CustomFieldSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  fieldKey: z.string().min(1, 'Field key is required').max(50, 'Field key must be less than 50 characters'),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea']).default('text'),
  fieldValue: z.string().optional().default(''),
  label: z.string().min(1, 'Label is required').max(100, 'Label must be less than 100 characters'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Time Entry Schema
export const TimeEntrySchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  description: z.string().max(500).optional().default(''),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Team Schema
export const TeamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional().default(''),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// AI Assistant Schema
export const AIAssistantSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt must be less than 1000 characters'),
  context: z.object({
    userId: z.string().optional(),
    lists: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    recentTasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
    })).optional(),
  }).optional(),
});

// AI Schedule Schema
export const AIScheduleSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task ID is required'),
  range: z.enum(['7d', '30d', '90d']).default('30d'),
});

// Calendar Connection Schema
export const CalendarConnectionSchema = z.object({
  provider: z.enum(['google', 'outlook', 'ical']),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  userId: z.string().uuid(),
});

// Focus Session Schema
export const FocusSessionSchema = z.object({
  taskId: z.string().uuid().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
  userId: z.string().uuid(),
});

// Email Template Schema
export const EmailTemplateSchema = z.object({
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

// Email Template Config type
export const EmailTemplateConfigSchema = z.object({
  brandColor: z.string().optional(),
  brandName: z.string().optional(),
  footerText: z.string().optional(),
  showLogo: z.boolean().optional(),
});
export type EmailTemplateConfig = z.infer<typeof EmailTemplateConfigSchema>;

// Helper function to validate and parse
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(', '));
  }
  return result.data;
}
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
  reminderTime: z.string().nullable().optional(), // YYYY-MM-DDTHH:mm:ss
  estimateHours: z.number().default(0),
  estimateMinutes: z.number().default(0),
  actualHours: z.number().default(0),
  actualMinutes: z.number().default(0),
  priority: Priority.default('none'),
  status: TaskStatus.default('pending'),
  recurringType: RecurringType.default('none'),
  recurringInterval: z.string().default(''),
  isAllDay: z.boolean().default(false),
  isHabit: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  assigneeId: z.string().nullable().optional(), // User ID of assignee
  assigneeName: z.string().nullable().optional(), // Denormalized for display
  labels: z.array(z.string()).optional(), // Label IDs attached to this task
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

export const TaskDependencySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  dependsOnId: z.string(),
  createdAt: z.string(),
});

export const TaskShareSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string(),
});

export const ListShareSchema = z.object({
  id: z.string(),
  listId: z.string(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  createdAt: z.string(),
});

export const TaskCommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  parentId: z.string().nullable().optional(),
  userId: z.string(),
  userName: z.string(),
  content: z.string(),
  createdAt: z.string(),
  replies: z.array(z.any()).optional(),
});

export const TaskTemplateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().default(''),
  priority: Priority.default('none'),
  estimateHours: z.number().default(0),
  estimateMinutes: z.number().default(0),
  isAllDay: z.boolean().default(false),
  recurringType: RecurringType.default('none'),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  downloadCount: z.number().default(0),
  rating: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// PushSubscription is defined in db/operations.ts as an interface
// This is just for API type safety
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export const GoalPeriod = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
export type GoalPeriod = z.infer<typeof GoalPeriod>;

export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().default(''),
  targetValue: z.number().min(1),
  unit: z.string().default('tasks'),
  period: GoalPeriod.default('weekly'),
  category: z.string().default('general'),
  color: z.string().default('#3b82f6'),
  currentValue: z.number().default(0),
  isCompleted: z.boolean().default(false),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type List = z.infer<typeof ListSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Label = z.infer<typeof LabelSchema>;
export type TaskLabel = z.infer<typeof TaskLabelSchema>;
export type TaskHistory = z.infer<typeof TaskHistorySchema>;
export type Reminder = z.infer<typeof ReminderSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type TaskDependency = z.infer<typeof TaskDependencySchema>;
export type TaskShare = z.infer<typeof TaskShareSchema>;
export type ListShare = z.infer<typeof ListShareSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;
export type TimeEntry = z.infer<typeof TimeEntrySchema>;

// === Team Schemas ===
export const TeamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional().default(''),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Team = z.infer<typeof TeamSchema>;

// === Additional Schemas ===

export const CustomFieldSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  fieldKey: z.string().min(1, 'Field key is required').max(50, 'Field key must be less than 50 characters'),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea']).default('text'),
  fieldValue: z.string().optional().default(''),
  label: z.string().min(1, 'Label is required').max(100, 'Label must be less than 100 characters'),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type CustomField = z.infer<typeof CustomFieldSchema>;

// Helper type for creating custom fields
export type CustomFieldInput = Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  fieldValue?: string;
};

// === Automation Rule Schema ===
export const AutomationRuleSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  triggerType: z.enum(['task_completed', 'task_created', 'task_updated', 'due_date_passed', 'status_changed', 'priority_changed']),
  triggerValue: z.string().optional(),
  actionType: z.enum(['create_task', 'update_task', 'set_priority', 'add_label', 'assign_user', 'send_notification']),
  actionValue: z.string().optional(),
  isEnabled: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AutomationRule = z.infer<typeof AutomationRuleSchema>;

// === Saved View Schema ===
export const SavedViewSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  icon: z.string().default('🔍'),
  filters: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedView = z.infer<typeof SavedViewSchema>;

// === Notification Settings Schema ===
export const NotificationSettingsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  reminderLeadTime: z.number().default(15),
  quietHoursStart: z.string().default('22:00'),
  quietHoursEnd: z.string().default('08:00'),
  notificationDays: z.array(z.string()).default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

// === Theme Schema ===
export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  colors: z.record(z.string()).or(z.string()), // Can be JSON object or string from DB
  emoji: z.string().default('🎨'),
  isCustom: z.boolean().default(true),
  createdBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Theme = z.infer<typeof ThemeSchema>;

// === Email Template Schema ===
export const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['reminder', 'welcome', 'password-reset', 'notification']),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().min(1, 'Text content is required'),
  config: z.record(z.any()),
  createdBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// === User Schema ===
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  avatar: z.string().optional(),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// === Session Schema ===
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;

// === Password Reset Token Schema ===
export const PasswordResetTokenSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.string(),
  used: z.boolean().default(false),
  createdAt: z.string(),
});

export type PasswordResetToken = z.infer<typeof PasswordResetTokenSchema>;

// === MFA Secret Schema ===
export const MfaSecretSchema = z.object({
  id: z.string(),
  userId: z.string(),
  secret: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MfaSecret = z.infer<typeof MfaSecretSchema>;

// === Audit Log Schema ===
export const AuditLogSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  userId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  details: z.string().optional(),
  timestamp: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// === Comment Mention Schema ===
export const CommentMentionSchema = z.object({
  id: z.string(),
  commentId: z.string(),
  userId: z.string(),
  userName: z.string(),
  isNotified: z.boolean().default(false),
  createdAt: z.string(),
});

export type CommentMention = z.infer<typeof CommentMentionSchema>;

// === Time Entry Schema ===
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

// === Habit Streak Schema ===
export const HabitStreakSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  lastCompleted: z.string().nullable().optional(),
  streakStart: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type HabitStreak = z.infer<typeof HabitStreakSchema>;

// === Refresh Token Schema ===
export const RefreshTokenSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
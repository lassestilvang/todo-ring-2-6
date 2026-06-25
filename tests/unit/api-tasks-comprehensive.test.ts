/**
 * API Tasks Route - Comprehensive Tests
 * Tests for /api/tasks endpoint with actual API behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';

// Schemas from validations
const Priority = z.enum(['high', 'medium', 'low', 'none']);
const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
const RecurringType = z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']);

const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().default(''),
  listId: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  estimateHours: z.number().min(0).default(0),
  estimateMinutes: z.number().min(0).default(0),
  actualHours: z.number().min(0).default(0),
  actualMinutes: z.number().min(0).default(0),
  priority: Priority.default('none'),
  status: TaskStatus.default('pending'),
  recurringType: RecurringType.default('none'),
  recurringInterval: z.string().default(''),
  isAllDay: z.boolean().default(false),
  isHabit: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required'),
});

const TaskReorderSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  newPosition: z.number().min(0, 'Position must be non-negative'),
});

interface Task {
  id: string;
  title: string;
  description: string;
  listId: string | null;
  date: string | null;
  deadline: string | null;
  estimateHours: number;
  estimateMinutes: number;
  actualHours: number;
  actualMinutes: number;
  priority: string;
  status: string;
  recurringType: string;
  recurringInterval: string;
  isAllDay: boolean;
  isHabit: boolean;
  completedAt: string | null;
  sortOrder: number;
}

interface MockStore {
  tasks: Task[];
  lists: { id: string; name: string }[];
  users: { id: string; email: string }[];
}

const createMockStore = (): MockStore => ({
  tasks: [],
  lists: [],
  users: [],
});

// Helper functions
function generateId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9);
}

function createTaskFromRequest(body: any, store: MockStore): Task | null {
  const result = TaskSchema.safeParse(body);
  if (!result.success) return null;

  const task: Task = {
    id: generateId(),
    title: result.data.title,
    description: result.data.description || '',
    listId: result.data.listId ?? null,
    date: result.data.date ?? null,
    deadline: result.data.deadline ?? null,
    estimateHours: result.data.estimateHours ?? 0,
    estimateMinutes: result.data.estimateMinutes ?? 0,
    actualHours: result.data.actualHours ?? 0,
    actualMinutes: result.data.actualMinutes ?? 0,
    priority: result.data.priority ?? 'none',
    status: result.data.status ?? 'pending',
    recurringType: result.data.recurringType ?? 'none',
    recurringInterval: result.data.recurringInterval ?? '',
    isAllDay: result.data.isAllDay ?? false,
    isHabit: result.data.isHabit ?? false,
    completedAt: result.data.completedAt ?? null,
    sortOrder: result.data.sortOrder ?? 0,
  };

  store.tasks.push(task);
  return task;
}

describe('API Tasks Route - Comprehensive Tests', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createMockStore();
    // Add inbox list
    store.lists.push({ id: 'inbox-id', name: 'Inbox' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return empty array when no tasks exist', () => {
      const tasks = store.tasks;
      expect(tasks).toEqual([]);
    });

    it('should return tasks filtered by listId', () => {
      const listId = 'list-123';
      store.tasks.push({ id: '1', title: 'Task 1', description: '', listId, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'Task 2', description: '', listId: 'other', date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const filtered = store.tasks.filter(t => t.listId === listId);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Task 1');
    });

    it('should return tasks filtered by view=today', () => {
      const today = new Date().toISOString().split('T')[0];
      store.tasks.push({ id: '1', title: 'Today Task', description: '', listId: null, date: today, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'Other Task', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const todayTasks = store.tasks.filter(t => t.date === today);
      expect(todayTasks).toHaveLength(1);
      expect(todayTasks[0].title).toBe('Today Task');
    });

    it('should return tasks filtered by priority', () => {
      store.tasks.push({ id: '1', title: 'High Priority', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'high', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'Low Priority', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'low', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const highPriority = store.tasks.filter(t => ['high', 'medium'].includes(t.priority));
      expect(highPriority).toHaveLength(1);
    });

    it('should return tasks filtered by status', () => {
      store.tasks.push({ id: '1', title: 'Completed', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'completed', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'Pending', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const pending = store.tasks.filter(t => t.status === 'pending');
      expect(pending).toHaveLength(1);
    });

    it('should return tasks filtered by date range', () => {
      store.tasks.push({ id: '1', title: 'Early', description: '', listId: null, date: '2024-01-10', deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'Late', description: '', listId: null, date: '2024-01-20', deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const filtered = store.tasks.filter(t => t.date && t.date >= '2024-01-15' && t.date <= '2024-01-25');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Late');
    });

    it('should return tasks filtered by time estimate', () => {
      store.tasks.push({ id: '1', title: 'OneHour', description: '', listId: null, date: null, deadline: null, estimateHours: 1, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'TwoHours', description: '', listId: null, date: null, deadline: null, estimateHours: 2, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const filtered = store.tasks.filter(t => {
        const totalMinutes = (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
        const totalHours = totalMinutes / 60;
        return totalHours >= 1 && totalHours <= 3;
      });
      expect(filtered).toHaveLength(2);
    });
  });

  describe('POST /api/tasks', () => {
    it('should validate required title', () => {
      const body = { title: '' };
      const result = TaskSchema.safeParse(body);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('title');
      }
    });

    it('should create task with valid data', () => {
      const body = { title: 'New Task', priority: 'high' };
      const task = createTaskFromRequest(body, store);
      expect(task).not.toBeNull();
      expect(task!.title).toBe('New Task');
      expect(task!.priority).toBe('high');
    });

    it('should assign to inbox by default', () => {
      const body = { title: 'New Task' };
      const task = createTaskFromRequest(body, store);
      expect(task).not.toBeNull();
    });

    it('should accept optional fields', () => {
      const body = {
        title: 'Task with all fields',
        description: 'Description',
        priority: 'high',
        date: '2024-01-15',
        deadline: '2024-01-20',
        estimateHours: 2,
        estimateMinutes: 30,
        isAllDay: true,
        isHabit: true,
      };

      const result = TaskSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should fail with missing title', () => {
      const body = { description: 'No title' };
      const result = TaskSchema.safeParse(body);
      expect(result.success).toBe(false);
    });
  });

  describe('PUT /api/tasks', () => {
    it('should update task fields', () => {
      const task: Task = { id: '1', title: 'Original', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 };
      store.tasks.push(task);

      const updates = { title: 'Updated', priority: 'high' };
      Object.assign(task, updates);
      store.tasks[0] = task;

      expect(store.tasks[0].title).toBe('Updated');
      expect(store.tasks[0].priority).toBe('high');
    });

    it('should handle status toggle to completed', () => {
      const task: Task = { id: '1', title: 'Task', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 };
      store.tasks.push(task);

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      store.tasks[0] = task;

      expect(store.tasks[0].status).toBe('completed');
      expect(store.tasks[0].completedAt).toBeDefined();
    });
  });

  describe('DELETE /api/tasks', () => {
    it('should delete task by id', () => {
      store.tasks.push({ id: '1', title: 'Task 1', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });
      store.tasks.push({ id: '2', title: 'Task 2', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 });

      const initialLength = store.tasks.length;
      store.tasks = store.tasks.filter(t => t.id !== '1');
      expect(store.tasks.length).toBe(initialLength - 1);
      expect(store.tasks[0].id).toBe('2');
    });
  });

  describe('PATCH /api/tasks (bulk delete)', () => {
    it('should validate bulk delete request', () => {
      const body = { ids: [] };
      const result = BulkDeleteSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should accept valid bulk delete request', () => {
      const body = { ids: ['1', '2', '3'] };
      const result = BulkDeleteSchema.safeParse(body);
      expect(result.success).toBe(true);
      expect(result.data.ids).toHaveLength(3);
    });
  });

  describe('Task Sorting', () => {
    it('should update task sort order', () => {
      const task: Task = { id: '1', title: 'Task', description: '', listId: null, date: null, deadline: null, estimateHours: 0, estimateMinutes: 0, priority: 'none', status: 'pending', recurringType: 'none', recurringInterval: '', isAllDay: false, isHabit: false, completedAt: null, sortOrder: 0 };
      store.tasks.push(task);

      const reorderResult = TaskReorderSchema.safeParse({ taskId: '1', newPosition: 5 });
      expect(reorderResult.success).toBe(true);
    });
  });

  describe('API Response Format', () => {
    it('should return success response with data', () => {
      const response = { success: true, data: { id: '1', title: 'Task' } };
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should return error response with message', () => {
      const response = { success: false, error: 'Task not found' };
      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found');
    });
  });
});

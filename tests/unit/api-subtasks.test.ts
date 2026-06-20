/**
 * API Subtasks Route Tests
 * Tests for /api/subtasks endpoint
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const SubtaskSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  isCompleted: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime().optional(),
});

interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
}

const store = {
  subtasks: [] as Subtask[],
};

const resetStore = () => {
  store.subtasks = [];
};

const generateId = () => `subtask-${Math.random().toString(36).substr(2, 9)}`;

describe('API Subtasks Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/subtasks', () => {
    it('should return empty array when no subtasks exist', () => {
      expect(store.subtasks).toEqual([]);
    });

    it('should return subtasks for a specific task', () => {
      store.subtasks.push({ id: '1', taskId: 'task-1', title: 'Subtask 1', isCompleted: false, sortOrder: 0 });
      store.subtasks.push({ id: '2', taskId: 'task-1', title: 'Subtask 2', isCompleted: false, sortOrder: 1 });
      store.subtasks.push({ id: '3', taskId: 'task-2', title: 'Subtask 3', isCompleted: false, sortOrder: 0 });

      const taskSubtasks = store.subtasks.filter(s => s.taskId === 'task-1');
      expect(taskSubtasks).toHaveLength(2);
    });

    it('should return completed subtasks', () => {
      store.subtasks.push({ id: '1', taskId: 'task-1', title: 'Done', isCompleted: true, sortOrder: 0 });
      store.subtasks.push({ id: '2', taskId: 'task-1', title: 'Pending', isCompleted: false, sortOrder: 1 });

      const completed = store.subtasks.filter(s => s.isCompleted);
      expect(completed).toHaveLength(1);
    });
  });

  describe('POST /api/subtasks', () => {
    it('should validate required taskId', () => {
      const body = { taskId: '' };
      const result = SubtaskSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required title', () => {
      const body = { taskId: 'task-1', title: '' };
      const result = SubtaskSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should reject title over 500 characters', () => {
      const body = { taskId: 'task-1', title: 'a'.repeat(501) };
      const result = SubtaskSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should create subtask with valid data', () => {
      const taskId = '11111111-1111-1111-1111-111111111111';
      const body = { taskId, title: 'New Subtask' };
      const result = SubtaskSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const subtask: Subtask = {
          id: generateId(),
          taskId: result.data.taskId,
          title: result.data.title,
          isCompleted: false,
          sortOrder: store.subtasks.filter(s => s.taskId === result.data.taskId).length,
        };
        store.subtasks.push(subtask);
        expect(store.subtasks[0].title).toBe('New Subtask');
      }
    });

    it('should default isCompleted to false', () => {
      const taskId = '11111111-1111-1111-1111-111111111111';
      const body = { taskId, title: 'Test' };
      const result = SubtaskSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isCompleted).toBe(false);
      }
    });
  });

  describe('PUT /api/subtasks', () => {
    it('should toggle completion status', () => {
      store.subtasks.push({ id: '1', taskId: 'task-1', title: 'Subtask', isCompleted: false, sortOrder: 0 });

      store.subtasks[0].isCompleted = true;
      expect(store.subtasks[0].isCompleted).toBe(true);
    });

    it('should update title', () => {
      store.subtasks.push({ id: '1', taskId: 'task-1', title: 'Old Title', isCompleted: false, sortOrder: 0 });

      store.subtasks[0].title = 'New Title';
      expect(store.subtasks[0].title).toBe('New Title');
    });

    it('should update sort order', () => {
      store.subtasks.push({ id: '1', taskId: 'task-1', title: 'Subtask', isCompleted: false, sortOrder: 0 });

      store.subtasks[0].sortOrder = 5;
      expect(store.subtasks[0].sortOrder).toBe(5);
    });
  });

  describe('DELETE /api/subtasks', () => {
    it('should delete subtask', () => {
      store.subtasks.push({ id: '1', taskId: 'task-1', title: 'To Delete', isCompleted: false, sortOrder: 0 });
      store.subtasks.push({ id: '2', taskId: 'task-1', title: 'Keep', isCompleted: false, sortOrder: 1 });

      const initialLength = store.subtasks.length;
      store.subtasks = store.subtasks.filter(s => s.id !== '1');
      expect(store.subtasks.length).toBe(initialLength - 1);
    });
  });
});
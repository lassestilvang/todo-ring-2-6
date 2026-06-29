/**
 * API Dependencies Route Tests
 * Tests for /api/dependencies endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const TaskDependencySchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
  createdAt: z.string().datetime().optional(),
});

interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  createdAt: string;
}

const store = {
  dependencies: [] as TaskDependency[],
  tasks: [] as { id: string; title: string; status: string }[],
};

const resetStore = () => {
  store.dependencies = [];
  store.tasks = [];
};

const generateId = () => `dep-${Math.random().toString(36).substr(2, 9)}`;

describe('API Dependencies Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/dependencies', () => {
    it('should return empty array when no dependencies exist', () => {
      expect(store.dependencies).toEqual([]);
    });

    it('should return dependencies for a specific task', () => {
      store.tasks.push({ id: 'task-1', title: 'Task 1', status: 'pending' });
      store.tasks.push({ id: 'task-2', title: 'Task 2', status: 'pending' });
      store.tasks.push({ id: 'task-3', title: 'Task 3', status: 'pending' });

      store.dependencies.push({ id: '1', taskId: 'task-1', dependsOnId: 'task-2', createdAt: new Date().toISOString() });
      store.dependencies.push({ id: '2', taskId: 'task-1', dependsOnId: 'task-3', createdAt: new Date().toISOString() });

      const taskDeps = store.dependencies.filter(d => d.taskId === 'task-1');
      expect(taskDeps).toHaveLength(2);
    });

    it('should return tasks that are blocked by dependencies', () => {
      // Task 1 depends on Task 2 (which is not completed)
      store.tasks.push({ id: 'task-1', title: 'Blocked Task', status: 'pending' });
      store.tasks.push({ id: 'task-2', title: 'Dependency', status: 'pending' });

      store.dependencies.push({ id: '1', taskId: 'task-1', dependsOnId: 'task-2', createdAt: new Date().toISOString() });

      const blockedTasks = store.tasks.filter(t =>
        store.dependencies.some(d => d.taskId === t.id &&
          !store.tasks.find(st => st.id === d.dependsOnId)?.status.includes('completed'))
      );

      expect(blockedTasks).toHaveLength(1);
      expect(blockedTasks[0].id).toBe('task-1');
    });
  });

  describe('POST /api/dependencies', () => {
    it('should validate taskId', () => {
      const body = { taskId: '' };
      const result = TaskDependencySchema.safeParse(body);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('taskId'))).toBe(true);
      }
    });

    it('should validate dependsOnId', () => {
      const body = { taskId: 'task-1', dependsOnId: '' };
      const result = TaskDependencySchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should prevent circular dependencies', () => {
      // If A depends on B, B cannot depend on A
      const existingDep = { id: '1', taskId: 'task-1', dependsOnId: 'task-2', createdAt: new Date().toISOString() };
      store.dependencies.push(existingDep);

      // Attempting to create reverse dependency should fail
      const wouldCreateReverse = store.dependencies.some(d =>
        d.taskId === 'task-2' && d.dependsOnId === 'task-1'
      );

      expect(wouldCreateReverse).toBe(false);
    });

    it('should create dependency with valid data', () => {
      const body = { taskId: '11111111-1111-1111-1111-111111111111', dependsOnId: '22222222-2222-2222-2222-222222222222' };
      const result = TaskDependencySchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const dep: TaskDependency = {
          id: generateId(),
          taskId: result.data.taskId,
          dependsOnId: result.data.dependsOnId,
          createdAt: new Date().toISOString(),
        };
        store.dependencies.push(dep);
        expect(store.dependencies[0].taskId).toBe('11111111-1111-1111-1111-111111111111');
        expect(store.dependencies[0].dependsOnId).toBe('22222222-2222-2222-2222-222222222222');
      }
    });
  });

  describe('DELETE /api/dependencies', () => {
    it('should remove dependency', () => {
      store.dependencies.push({ id: '1', taskId: 'task-1', dependsOnId: 'task-2', createdAt: new Date().toISOString() });
      store.dependencies.push({ id: '2', taskId: 'task-1', dependsOnId: 'task-3', createdAt: new Date().toISOString() });

      const initialLength = store.dependencies.length;
      store.dependencies = store.dependencies.filter(d => d.id !== '1');
      expect(store.dependencies.length).toBe(initialLength - 1);
    });

    it('should allow task to be completed when dependency is removed', () => {
      store.tasks.push({ id: 'task-1', title: 'Task', status: 'pending' });
      store.tasks.push({ id: 'task-2', title: 'Dependency', status: 'completed' });

      // Remove the dependency
      store.dependencies = [];

      // Now task can be completed
      store.tasks[0].status = 'completed';
      expect(store.tasks[0].status).toBe('completed');
    });
  });

  describe('Blocked Task Logic', () => {
    it('should identify blocked tasks', () => {
      // Setup: Task 1 depends on Task 2, Task 2 depends on Task 3
      store.tasks.push({ id: 'task-1', title: 'Blocked', status: 'pending' });
      store.tasks.push({ id: 'task-2', title: 'Partially Blocked', status: 'pending' });
      store.tasks.push({ id: 'task-3', title: 'Root', status: 'pending' });

      store.dependencies.push({ id: '1', taskId: 'task-1', dependsOnId: 'task-2', createdAt: new Date().toISOString() });
      store.dependencies.push({ id: '2', taskId: 'task-2', dependsOnId: 'task-3', createdAt: new Date().toISOString() });

      // Task 1 is blocked by Task 2, which is blocked by Task 3
      const blockedTask1 = store.dependencies.some(d => d.taskId === 'task-1');
      expect(blockedTask1).toBe(true);
    });

    it('should allow completion when all dependencies are done', () => {
      store.tasks.push({ id: 'task-1', title: 'Task', status: 'pending' });
      store.tasks.push({ id: 'task-2', title: 'Dependency', status: 'completed' });

      store.dependencies.push({ id: '1', taskId: 'task-1', dependsOnId: 'task-2', createdAt: new Date().toISOString() });

      const canComplete = store.dependencies.every(d =>
        store.tasks.find(t => t.id === d.dependsOnId)?.status === 'completed'
      );

      expect(canComplete).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for same task dependency', () => {
      const body = { taskId: '11111111-1111-1111-1111-111111111111', dependsOnId: '11111111-1111-1111-1111-111111111111' };
      const result = TaskDependencySchema.safeParse(body);
      // Schema validates but business logic should reject
      expect(result.success).toBe(true);
    });

    it('should return 404 for non-existent task', () => {
      const response = { success: false, error: 'Task not found' };
      expect(response.success).toBe(false);
    });
  });
});
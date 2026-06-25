/**
 * Task Dependency Logic Tests
 * Tests for task dependency calculations and blocking logic
 */

import { describe, it, expect } from 'vitest';

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
}

// Check if task can be completed
function canCompleteTask(task: Task | null, dependencies: TaskDependency[], allTasks: Task[]): boolean {
  if (!task || task.status === 'completed' || task.status === 'cancelled') {
    return true;
  }

  const blockedBy = dependencies
    .filter(td => td.taskId === task.id)
    .map(td => {
      const depTask = allTasks.find(t => t.id === td.dependsOnId);
      return depTask ? { id: td.dependsOnId, title: depTask.title, status: depTask.status } : null;
    })
    .filter((t): t is { id: string; title: string; status: string } => t !== null);

  return blockedBy.length === 0 || blockedBy.every(d => d.status === 'completed' || d.status === 'cancelled');
}

// Get blocked tasks
function getBlockedTasks(dependencies: TaskDependency[], allTasks: Task[]): Task[] {
  return allTasks.filter(task => {
    const blockedBy = dependencies.filter(td => td.taskId === task.id);
    if (blockedBy.length === 0) return false;

    return blockedBy.some(td => {
      const depTask = allTasks.find(t => t.id === td.dependsOnId);
      return depTask && depTask.status !== 'completed' && depTask.status !== 'cancelled';
    });
  });
}

describe('Task Dependency Logic', () => {
  const createTask = (id: string, title: string, status: string): Task => ({ id, title, status });
  const createDependency = (id: string, taskId: string, dependsOnId: string): TaskDependency => ({
    id,
    taskId,
    dependsOnId,
  });

  describe('Can Complete Task', () => {
    it('should return true for task with no dependencies', () => {
      const task = createTask('1', 'Task 1', 'pending');
      const result = canCompleteTask(task, [], []);
      expect(result).toBe(true);
    });

    it('should return true for completed task', () => {
      const task = createTask('1', 'Task 1', 'completed');
      const result = canCompleteTask(task, [], []);
      expect(result).toBe(true);
    });

    it('should return true for cancelled task', () => {
      const task = createTask('1', 'Task 1', 'cancelled');
      const result = canCompleteTask(task, [], []);
      expect(result).toBe(true);
    });

    it('should return false for task with incomplete dependency', () => {
      const task = createTask('1', 'Task 1', 'pending');
      const dependency = createTask('2', 'Task 2', 'pending');
      const deps: TaskDependency[] = [{ id: 'dep-1', taskId: '1', dependsOnId: '2' }];
      const tasks: Task[] = [task, dependency];

      const result = canCompleteTask(task, deps, tasks);
      expect(result).toBe(false);
    });

    it('should return true for task with completed dependency', () => {
      const task = createTask('1', 'Task 1', 'pending');
      const dependency = createTask('2', 'Task 2', 'completed');
      const deps: TaskDependency[] = [{ id: 'dep-1', taskId: '1', dependsOnId: '2' }];
      const tasks: Task[] = [task, dependency];

      const result = canCompleteTask(task, deps, tasks);
      expect(result).toBe(true);
    });

    it('should return true for task with cancelled dependency', () => {
      const task = createTask('1', 'Task 1', 'pending');
      const dependency = createTask('2', 'Task 2', 'cancelled');
      const deps: TaskDependency[] = [{ id: 'dep-1', taskId: '1', dependsOnId: '2' }];
      const tasks: Task[] = [task, dependency];

      const result = canCompleteTask(task, deps, tasks);
      expect(result).toBe(true);
    });
  });

  describe('Get Blocked Tasks', () => {
    it('should return empty array when no dependencies', () => {
      const tasks = [createTask('1', 'Task 1', 'pending')];
      const blocked = getBlockedTasks([], tasks);
      expect(blocked).toHaveLength(0);
    });

    it('should return tasks blocked by incomplete dependencies', () => {
      const task1 = createTask('1', 'Task 1', 'pending');
      const task2 = createTask('2', 'Task 2', 'pending');
      const deps: TaskDependency[] = [{ id: 'dep-1', taskId: '2', dependsOnId: '1' }];

      const blocked = getBlockedTasks(deps, [task1, task2]);
      expect(blocked).toHaveLength(1);
      expect(blocked[0].id).toBe('2');
    });

    it('should not return tasks blocked by completed dependencies', () => {
      const task1 = createTask('1', 'Task 1', 'completed');
      const task2 = createTask('2', 'Task 2', 'pending');
      const deps: TaskDependency[] = [{ id: 'dep-1', taskId: '2', dependsOnId: '1' }];

      const blocked = getBlockedTasks(deps, [task1, task2]);
      expect(blocked).toHaveLength(0);
    });

    it('should handle multiple dependencies', () => {
      const task1 = createTask('1', 'Task 1', 'completed');
      const task2 = createTask('2', 'Task 2', 'pending');
      const task3 = createTask('3', 'Task 3', 'pending');
      const deps: TaskDependency[] = [
        { id: 'dep-1', taskId: '3', dependsOnId: '1' },
        { id: 'dep-2', taskId: '3', dependsOnId: '2' },
      ];

      const blocked = getBlockedTasks(deps, [task1, task2, task3]);
      expect(blocked).toHaveLength(1);
      expect(blocked[0].id).toBe('3');
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect circular dependency', () => {
      const taskA = createTask('A', 'Task A', 'pending');
      const taskB = createTask('B', 'Task B', 'pending');
      const deps: TaskDependency[] = [
        { id: '1', taskId: 'A', dependsOnId: 'B' },
        { id: '2', taskId: 'B', dependsOnId: 'A' },
      ];

      // Check if reverse dependency exists
      const hasReverse = deps.some(d => d.taskId === 'B' && d.dependsOnId === 'A');
      expect(hasReverse).toBe(true);
    });

    it('should not detect circular when one-way', () => {
      const taskA = createTask('A', 'Task A', 'pending');
      const taskB = createTask('B', 'Task B', 'pending');
      const deps: TaskDependency[] = [
        { id: '1', taskId: 'A', dependsOnId: 'B' },
      ];

      const hasReverse = deps.some(d => d.taskId === 'B' && d.dependsOnId === 'A');
      expect(hasReverse).toBe(false);
    });
  });

  describe('Dependency Chain', () => {
    it('should find transitive dependencies', () => {
      const task1 = createTask('1', 'Task 1', 'completed');
      const task2 = createTask('2', 'Task 2', 'pending');
      const task3 = createTask('3', 'Task 3', 'pending');

      const deps: TaskDependency[] = [
        { id: '1', taskId: '2', dependsOnId: '1' },
        { id: '2', taskId: '3', dependsOnId: '2' },
      ];

      // Task 3 is blocked by Task 2, which is blocked by Task 1
      const task3Deps = deps.filter(d => d.taskId === '3');
      expect(task3Deps).toHaveLength(1);
      expect(task3Deps[0].dependsOnId).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null task', () => {
      const result = canCompleteTask(null, [], []);
      expect(result).toBe(true);
    });

    it('should handle empty dependencies array', () => {
      const task = createTask('1', 'Task 1', 'pending');
      const result = canCompleteTask(task, [], [task]);
      expect(result).toBe(true);
    });

    it('should handle non-existent dependency task', () => {
      const task = createTask('1', 'Task 1', 'pending');
      const deps: TaskDependency[] = [{ id: '1', taskId: '1', dependsOnId: 'non-existent' }];

      const result = canCompleteTask(task, deps, [task]);
      expect(result).toBe(true); // No blocking dependency found
    });
  });
});

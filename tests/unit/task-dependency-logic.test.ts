/**
 * Task Dependency Logic Tests
 *
 * Tests the task dependency and blocking logic independently.
 */

import { describe, it, expect } from 'vitest';

interface Task {
  id: string;
  status: string;
}

interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
}

// Replicate the canCompleteTask logic
function canCompleteTask(
  task: Task | undefined,
  dependencies: TaskDependency[],
  allTasks: Map<string, Task>
): boolean {
  if (!task || task.status === 'completed' || task.status === 'cancelled') {
    return true;
  }

  const blockedBy = dependencies
    .filter(td => td.taskId === task.id)
    .map(td => allTasks.get(td.dependsOnId))
    .filter((t): t is Task => t !== undefined);

  return blockedBy.length === 0 || blockedBy.every(d => d.status === 'completed' || d.status === 'cancelled');
}

describe('Task Dependency Logic', () => {
  const tasks = new Map<string, Task>();
  tasks.set('task-1', { id: 'task-1', status: 'pending' });
  tasks.set('task-2', { id: 'task-2', status: 'completed' });
  tasks.set('task-3', { id: 'task-3', status: 'cancelled' });

  describe('canCompleteTask', () => {
    it('should return true when task is not found', () => {
      const dependencies: TaskDependency[] = [];
      const result = canCompleteTask(undefined, dependencies, tasks);
      expect(result).toBe(true);
    });

    it('should return true when task is completed', () => {
      const task = tasks.get('task-2')!;
      const dependencies: TaskDependency[] = [];
      const result = canCompleteTask(task, dependencies, tasks);
      expect(result).toBe(true);
    });

    it('should return true when task is cancelled', () => {
      const task = tasks.get('task-3')!;
      const dependencies: TaskDependency[] = [];
      const result = canCompleteTask(task, dependencies, tasks);
      expect(result).toBe(true);
    });

    it('should return true when no dependencies exist', () => {
      const task = tasks.get('task-1')!;
      const dependencies: TaskDependency[] = [];
      const result = canCompleteTask(task, dependencies, tasks);
      expect(result).toBe(true);
    });

    it('should return false when has incomplete dependencies', () => {
      const task = tasks.get('task-1')!;
      const dependencies: TaskDependency[] = [
        { id: 'dep-1', taskId: 'task-1', dependsOnId: 'task-1' }
      ];
      const result = canCompleteTask(task, dependencies, tasks);
      expect(result).toBe(false);
    });

    it('should return true when all dependencies are completed', () => {
      const task = tasks.get('task-1')!;
      const dependencies: TaskDependency[] = [
        { id: 'dep-1', taskId: 'task-1', dependsOnId: 'task-2' }
      ];
      const result = canCompleteTask(task, dependencies, tasks);
      expect(result).toBe(true);
    });

    it('should return true when all dependencies are cancelled', () => {
      const task = tasks.get('task-1')!;
      const dependencies: TaskDependency[] = [
        { id: 'dep-1', taskId: 'task-1', dependsOnId: 'task-3' }
      ];
      const result = canCompleteTask(task, dependencies, tasks);
      expect(result).toBe(true);
    });
  });
});
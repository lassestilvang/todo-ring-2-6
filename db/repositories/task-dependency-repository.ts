import { BaseRepository } from './base-repository';
import type { TaskDependency } from '../../src/types/index';

export class TaskDependencyRepository extends BaseRepository<TaskDependency> {
  constructor() {
    super('task_dependencies');
  }

  getByTaskId(taskId: string): TaskDependency[] {
    return this.db.prepare(
      'SELECT * FROM task_dependencies WHERE task_id = ?'
    ).all(taskId) as TaskDependency[];
  }

  getByDependsOn(dependsOnId: string): TaskDependency[] {
    return this.db.prepare(
      'SELECT * FROM task_dependencies WHERE depends_on_id = ?'
    ).all(dependsOnId) as TaskDependency[];
  }

  checkCircularDependency(taskId: string, dependsOnId: string): boolean {
    const visited = new Set<string>();
    const check = (currentId: string): boolean => {
      if (visited.has(currentId)) return true;
      if (currentId === dependsOnId) return true;
      visited.add(currentId);
      const dependencies = this.getByTaskId(currentId);
      return dependencies.some(dep => check(dep.dependsOnId));
    };
    return check(taskId);
  }
}

export function getTaskDependencyRepository(): TaskDependencyRepository {
  return new TaskDependencyRepository();
}

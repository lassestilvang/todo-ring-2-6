import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import {
  getTaskDependencies,
  getTaskDependents,
  addTaskDependency,
  removeTaskDependency,
  getBlockedTasks,
} from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { TaskDependencySchema } from '@/lib/validations';

ensureDbInitialized();

/**
 * Check if adding a dependency would create a circular reference
 * Uses depth-first search to detect cycles
 */
function wouldCreateCycle(taskId: string, dependsOnId: string): boolean {
  // Build a map of all dependencies
  const allDeps = getTaskDependencies(taskId);
  const depMap = new Map<string, string[]>();

  // Get all dependencies for all tasks we need to check
  const allTasks = new Set([taskId]);
  let toProcess = [taskId];

  while (toProcess.length > 0) {
    const current = toProcess.pop()!;
    const deps = getTaskDependencies(current);
    depMap.set(current, deps.map(d => d.dependsOnId));
    deps.forEach(d => {
      if (!allTasks.has(d.dependsOnId)) {
        allTasks.add(d.dependsOnId);
        toProcess.push(d.dependsOnId);
      }
    });
  }

  // DFS to check for cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = depMap.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check if dependsOnId can reach taskId through existing dependencies
  if (depMap.has(dependsOnId)) {
    return dfs(dependsOnId);
  }

  return false;
}

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');
    const dependsOnId = searchParams.get('dependsOnId');
    const view = searchParams.get('view'); // 'blocked' or 'blocking'

    // Check for circular dependency
    if (taskId && dependsOnId) {
      const hasCycle = wouldCreateCycle(taskId, dependsOnId);
      return jsonSuccess({ hasCycle });
    }

    if (taskId) {
      if (view === 'blocked') {
        // Get tasks that this task is blocking (its dependents)
        const blocked = getTaskDependents(taskId);
        return jsonSuccess(blocked);
      } else if (view === 'blocking') {
        // Get tasks that this task is blocking (its dependencies)
        const blocking = getTaskDependencies(taskId);
        return jsonSuccess(blocking);
      }
      // Default: get both
      const [dependencies, dependents] = await Promise.all([
        getTaskDependencies(taskId),
        getTaskDependents(taskId),
      ]);
      return jsonSuccess({ dependencies, dependents });
    }

    // Get all blocked tasks
    const blockedTasks = getBlockedTasks();
    return jsonSuccess(blockedTasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dependencies';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = TaskDependencySchema.safeParse(body);

    if (!validated.success) {
      return jsonError(
        validated.error.errors.map(e => e.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }

    const { taskId, dependsOnId } = validated.data;

    // Prevent self-dependency
    if (taskId === dependsOnId) {
      return jsonError('Cannot create a dependency on itself', 400, 'INVALID_DEPENDENCY');
    }

    const dependency = addTaskDependency(taskId, dependsOnId);
    return jsonSuccess(dependency, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create dependency';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');
    const dependsOnId = searchParams.get('dependsOnId');

    if (!taskId || !dependsOnId) {
      return jsonError('taskId and dependsOnId are required', 400, 'MISSING_PARAMS');
    }

    removeTaskDependency(taskId, dependsOnId);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove dependency';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

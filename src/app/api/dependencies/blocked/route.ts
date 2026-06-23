// NextRequest removed - not used
import { ensureDbInitialized } from '@/lib/db-init';
import { getBlockedTasks } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import type { Task } from '@/types/index';

ensureDbInitialized();

export async function GET() {
  try {
    const blockedTasks = getBlockedTasks();
    // Return with task details
    const tasksWithDetails = blockedTasks.map((task: Task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
    }));
    return jsonSuccess(tasksWithDetails);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch blocked tasks';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}
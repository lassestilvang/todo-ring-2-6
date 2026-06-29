import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getTasks } from '@/db/operations';

ensureDbInitialized();

interface PrioritizedTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  score: number;
  reason: string;
}

// Simple scoring algorithm (in production, use ML model)
function calculateTaskScore(task: any): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Due date urgency
  if (task.deadline) {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 0) {
      score += 50;
      reasons.push('overdue');
    } else if (daysUntil <= 1) {
      score += 40;
      reasons.push('due today');
    } else if (daysUntil <= 3) {
      score += 30;
      reasons.push('due soon');
    } else if (daysUntil <= 7) {
      score += 20;
      reasons.push('due this week');
    }
  }

  // Deadline proximity boost
  if (task.deadline && new Date(task.deadline) < new Date(task.date || '')) {
    score += 25;
    reasons.push('deadline before date');
  }

  // Priority boost
  if (task.priority === 'high') {
    score += 30;
    reasons.push('high priority');
  } else if (task.priority === 'medium') {
    score += 15;
    reasons.push('medium priority');
  }

  // Dependency impact
  const dependencies = getDb().prepare(
    'SELECT td.* FROM task_dependencies td WHERE td.task_id = ?'
  ).all(task.id) as any[];

  if (dependencies.length > 0) {
    score += dependencies.length * 5;
    reasons.push(`${dependencies.length} dependency${dependencies.length > 1 ? 'ies' : ''}`);
  }

  // Incomplete dependencies penalty
  const blockedBy = getDb().prepare(
    `SELECT deps.id FROM task_dependencies td
     JOIN tasks deps ON td.depends_on_id = deps.id
     WHERE td.task_id = ? AND deps.status NOT IN ('completed', 'cancelled')`
  ).all(task.id) as any[];

  if (blockedBy.length > 0) {
    score -= 20;
    reasons.push('blocked by other tasks');
  }

  // Estimate time (longer tasks get higher priority)
  const totalMinutes = (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
  if (totalMinutes > 120) {
    score += 10;
    reasons.push('large task');
  }

  return { score: Math.max(0, Math.min(100, score)), reason: reasons.join(', ') };
}

// POST /api/ai/prioritize - Prioritize tasks
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { taskIds } = body;

    const tasks = taskIds
      ? getTasks()
      : getAllTasksWithDetails();

    const prioritized: PrioritizedTask[] = tasks
      .filter(t => !taskIds || taskIds.includes(t.id))
      .map(task => {
        const { score, reason } = calculateTaskScore(task);
        let priority: 'high' | 'medium' | 'low' | 'none' = 'none';

        if (score >= 70) priority = 'high';
        else if (score >= 40) priority = 'medium';
        else if (score > 0) priority = 'low';

        return {
          id: task.id,
          title: task.title,
          priority,
          score,
          reason,
        };
      })
      .sort((a, b) => b.score - a.score);

    return jsonSuccess(prioritized);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to prioritize tasks';
    return jsonError(message, 500, 'PRIORITIZE_ERROR');
  }
}

function getAllTasksWithDetails() {
  const db = getDb();
  return db.prepare(`
    SELECT t.*,
           GROUP_CONCAT(l.id) as labels
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    WHERE t.status IN ('pending', 'in_progress')
    GROUP BY t.id
  `).all() as any[];
}
/**
 * Habit Stack Repository
 * Handles habit stacking - linking habits together for behavior chaining
 */

import { getDb } from '../../db/index';

export interface HabitStack {
  id: string;
  anchorTaskId: string;      // The habit that triggers the stack
  linkedTaskId: string;      // The habit that gets triggered
  created_at: string;
  updated_at: string;
}

export class HabitStackRepository {
  private db = getDb();

  /**
   * Find all stacks anchored by a specific task
   */
  findByAnchor(anchorTaskId: string): HabitStack[] {
    return this.db.prepare(
      'SELECT * FROM habit_stacks WHERE anchor_task_id = ? ORDER BY created_at'
    ).all(anchorTaskId) as HabitStack[];
  }

  /**
   * Find all stacks linked to a specific task
   */
  findByLinked(linkedTaskId: string): HabitStack[] {
    return this.db.prepare(
      'SELECT * FROM habit_stacks WHERE linked_task_id = ? ORDER BY created_at'
    ).all(linkedTaskId) as HabitStack[];
  }

  /**
   * Find a specific stack
   */
  findOne(anchorTaskId: string, linkedTaskId: string): HabitStack | undefined {
    return this.db.prepare(
      'SELECT * FROM habit_stacks WHERE anchor_task_id = ? AND linked_task_id = ?'
    ).get(anchorTaskId, linkedTaskId) as HabitStack | undefined;
  }

  /**
   * Create a new habit stack
   */
  create(anchorTaskId: string, linkedTaskId: string): HabitStack {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO habit_stacks (id, anchor_task_id, linked_task_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, anchorTaskId, linkedTaskId, now, now);

    return this.findOne(anchorTaskId, linkedTaskId)!;
  }

  /**
   * Delete a habit stack
   */
  delete(anchorTaskId: string, linkedTaskId: string): boolean {
    const result = this.db.prepare(
      'DELETE FROM habit_stacks WHERE anchor_task_id = ? AND linked_task_id = ?'
    ).run(anchorTaskId, linkedTaskId);
    return result.changes > 0;
  }

  /**
   * Get the full chain starting from an anchor task
   */
  getChain(anchorTaskId: string): HabitStack[] {
    const chain: HabitStack[] = [];
    const visited = new Set<string>();
    this.buildChain(anchorTaskId, chain, visited);
    return chain;
  }

  private buildChain(taskId: string, chain: HabitStack[], visited: Set<string>): void {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const stacks = this.findByAnchor(taskId);
    for (const stack of stacks) {
      chain.push(stack);
      this.buildChain(stack.linkedTaskId, chain, visited);
    }
  }
}

let habitStackRepository: HabitStackRepository | null = null;

export function getHabitStackRepository(): HabitStackRepository {
  if (!habitStackRepository) {
    habitStackRepository = new HabitStackRepository();
  }
  return habitStackRepository;
}
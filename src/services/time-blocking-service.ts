/**
 * Time Blocking Service
 * Manages time blocks, scheduling, and conflict detection
 */

import { getDb } from '@/lib/db-client';
import type { Task } from '@/types/index';

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  taskId?: string | null;
  taskTitle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlockInput {
  title: string;
  startTime: string;
  endTime: string;
  taskId?: string;
}

/**
 * Get all time blocks for a user
 */
export function getTimeBlocks(userId: string): TimeBlock[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT tb.*, t.title as task_title
      FROM time_blocks tb
      LEFT JOIN tasks t ON tb.task_id = t.id
      WHERE tb.user_id = ?
      ORDER BY tb.start_time ASC
    `)
    .all(userId) as TimeBlock[];
}

/**
 * Get time blocks for a specific date
 */
export function getTimeBlocksForDate(userId: string, date: string): TimeBlock[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT tb.*, t.title as task_title
      FROM time_blocks tb
      LEFT JOIN tasks t ON tb.task_id = t.id
      WHERE tb.user_id = ? AND date(tb.start_time) = ?
      ORDER BY tb.start_time ASC
    `)
    .all(userId, date) as TimeBlock[];
}

/**
 * Create a new time block
 */
export function createTimeBlock(userId: string, data: TimeBlockInput): TimeBlock {
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO time_blocks (id, user_id, title, start_time, end_time, task_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, data.title, data.startTime, data.endTime, data.taskId);

  return getTimeBlock(id, userId);
}

/**
 * Get a single time block
 */
export function getTimeBlock(id: string, userId: string): TimeBlock | undefined {
  const db = getDb();
  return db
    .prepare(`
      SELECT tb.*, t.title as task_title
      FROM time_blocks tb
      LEFT JOIN tasks t ON tb.task_id = t.id
      WHERE tb.id = ? AND tb.user_id = ?
    `)
    .get(id, userId) as TimeBlock | undefined;
}

/**
 * Update a time block
 */
export function updateTimeBlock(id: string, userId: string, data: Partial<TimeBlockInput>): TimeBlock | undefined {
  const db = getDb();
  const existing = getTimeBlock(id, userId);

  if (!existing) return undefined;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.startTime !== undefined) {
    updates.push('start_time = ?');
    values.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.push('end_time = ?');
    values.push(data.endTime);
  }
  if (data.taskId !== undefined) {
    updates.push('task_id = ?');
    values.push(data.taskId);
  }

  if (updates.length === 0) return existing;

  values.push(id, userId);

  db.prepare(`
    UPDATE time_blocks
    SET ${updates.join(', ')}, updated_at = (datetime('now'))
    WHERE id = ? AND user_id = ?
  `).run(...values);

  return getTimeBlock(id, userId);
}

/**
 * Delete a time block
 */
export function deleteTimeBlock(id: string, userId: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM time_blocks WHERE id = ? AND user_id = ?'
  ).run(id, userId);
  return result.changes > 0;
}

/**
 * Check for scheduling conflicts
 */
export function checkConflicts(userId: string, startTime: string, endTime: string, excludeId?: string): TimeBlock[] {
  const db = getDb();
  const params: any[] = [userId, startTime, endTime];

  let query = `
    SELECT * FROM time_blocks
    WHERE user_id = ? AND (
      (start_time < ? AND end_time > ?) OR
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `;

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  return db.prepare(query).all(...params) as TimeBlock[];
}

/**
 * Get available time slots for a date
 */
export function getAvailableSlots(userId: string, date: string, durationMinutes: number = 60): Array<{ start: string; end: string }> {
  const db = getDb();
  const blocks = getTimeBlocksForDate(userId, date);

  // Generate all possible slots (every 30 minutes)
  const slots: Array<{ start: string; end: string }> = [];
  const slotDuration = 30;

  // Start from 8 AM
  let current = new Date(date + 'T08:00:00');
  const endOfDay = new Date(date + 'T20:00:00');

  while (current < endOfDay) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60000);

    // Check if this slot conflicts with any existing block
    const hasConflict = blocks.some(block => {
      const blockStart = new Date(block.start_time);
      const blockEnd = new Date(block.end_time);
      return (current < blockEnd && slotEnd > blockStart);
    });

    if (!hasConflict) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString()
      });
    }

    current = new Date(current.getTime() + slotDuration * 60000);
  }

  return slots;
}

/**
 * Move a task to a new time slot
 */
export function scheduleTask(userId: string, taskId: string, startTime: string, endTime: string): TimeBlock | null {
  // First, check if task exists and belongs to user
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId) as Task | undefined;

  if (!task) return null;

  // Create or update time block
  const existingBlock = db.prepare('SELECT * FROM time_blocks WHERE task_id = ? AND user_id = ?').get(taskId, userId) as TimeBlock | undefined;

  if (existingBlock) {
    return updateTimeBlock(existingBlock.id, userId, { startTime, endTime });
  } else {
    return createTimeBlock(userId, { title: task.title, startTime, endTime, taskId });
  }
}
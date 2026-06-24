/**
 * Recurring Exception Repository
 * Handles all database operations related to recurring task exceptions
 */

import { getDb } from '../../db/index';

export interface RecurringException {
  id: string;
  task_id: string;
  exception_date: string;
  reason: string;
  created_at: string;
}

export class RecurringExceptionRepository {
  private db = getDb();

  findByTaskId(taskId: string): RecurringException[] {
    return this.db.prepare(
      'SELECT * FROM recurring_exceptions WHERE task_id = ? ORDER BY exception_date DESC'
    ).all(taskId) as RecurringException[];
  }

  findById(id: string): RecurringException | undefined {
    return this.db.prepare('SELECT * FROM recurring_exceptions WHERE id = ?').get(id) as RecurringException | undefined;
  }

  findByDate(taskId: string, exceptionDate: string): RecurringException | undefined {
    return this.db.prepare(
      'SELECT * FROM recurring_exceptions WHERE task_id = ? AND exception_date = ?'
    ).get(taskId, exceptionDate) as RecurringException | undefined;
  }

  create(taskId: string, exceptionDate: string, reason?: string): RecurringException {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO recurring_exceptions (id, task_id, exception_date, reason, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, taskId, exceptionDate, reason || null, now);

    return this.findById(id)!;
  }

  delete(taskId: string, exceptionDate: string): void {
    this.db.prepare(
      'DELETE FROM recurring_exceptions WHERE task_id = ? AND exception_date = ?'
    ).run(taskId, exceptionDate);
  }

  deleteByTaskId(taskId: string): void {
    this.db.prepare('DELETE FROM recurring_exceptions WHERE task_id = ?').run(taskId);
  }
}

let recurringExceptionRepository: RecurringExceptionRepository | null = null;

export function getRecurringExceptionRepository(): RecurringExceptionRepository {
  if (!recurringExceptionRepository) {
    recurringExceptionRepository = new RecurringExceptionRepository();
  }
  return recurringExceptionRepository;
}
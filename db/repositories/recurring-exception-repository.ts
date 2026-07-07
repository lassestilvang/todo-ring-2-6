import { BaseRepository } from './base-repository';

export class RecurringExceptionRepository extends BaseRepository<any> {
  constructor() {
    super('recurring_exceptions');
  }

  getByTaskId(taskId: string): string[] {
    return this.db.prepare(
      'SELECT exception_date FROM recurring_exceptions WHERE task_id = ?'
    ).all(taskId).map((r: any) => r.exception_date);
  }

  add(taskId: string, exceptionDate: string, reason?: string): void {
    this.db.prepare(
      'INSERT INTO recurring_exceptions (id, task_id, exception_date, reason, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), taskId, exceptionDate, reason || null, new Date().toISOString());
  }

  remove(taskId: string, exceptionDate: string): void {
    this.db.prepare(
      'DELETE FROM recurring_exceptions WHERE task_id = ? AND exception_date = ?'
    ).run(taskId, exceptionDate);
  }
}

export function getRecurringExceptionRepository(): RecurringExceptionRepository {
  return new RecurringExceptionRepository();
}

import { getDb } from '../db-client';

/**
 * Base repository class providing common database operations
 */
export abstract class BaseRepository<T> {
  protected db = getDb();

  constructor(protected tableName: string) {}

  /**
   * Find a single record by ID
   */
  findById(id: string): T | undefined {
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as T | undefined;
  }

  /**
   * Find all records
   */
  findAll(): T[] {
    return this.db.prepare(`SELECT * FROM ${this.tableName}`).all() as T[];
  }

  /**
   * Delete a record by ID
   */
  delete(id: string): void {
    this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
  }

  /**
   * Execute a raw query with parameters
   */
  protected rawQuery(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * Execute a raw query and return single result
   */
  protected rawQueryOne(sql: string, params: any[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Generate UUID
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get current timestamp
   */
  protected now(): string {
    return new Date().toISOString();
  }
}
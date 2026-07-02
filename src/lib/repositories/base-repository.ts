/**
 * Base Repository Class
 * Provides common CRUD operations and utilities for all repositories
 */

import { getDb } from '../../db/index';

export interface RepositoryOptions {
  softDelete?: boolean;
  timestamps?: boolean;
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export abstract class BaseRepository<T> {
  protected db = getDb();
  protected tableName: string;
  protected options: RepositoryOptions;

  // Map of camelCase to snake_case field names
  protected fieldMap: Record<string, string> = {};

  constructor(tableName: string, options: RepositoryOptions = {}) {
    this.tableName = tableName;
    this.options = options;
    // Initialize field map for camelCase to snake_case conversion
    this.fieldMap = this.buildFieldMap();
  }

  /**
   * Build the field map for this repository's table
   */
  private buildFieldMap(): Record<string, string> {
    const map: Record<string, string> = {};
    // Common field mappings
    const commonFields: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      created_at: 'created_at',
      updated_at: 'updated_at',
      taskId: 'task_id',
      userId: 'user_id',
      userName: 'user_name',
      listId: 'list_id',
      labelId: 'label_id',
      parentId: 'parent_id',
      isCompleted: 'is_completed',
      isAllDay: 'is_all_day',
      fileSize: 'file_size',
      filePath: 'file_path',
      fileType: 'file_type',
      remindAt: 'remind_at',
      isFired: 'is_fired',
      role: 'role',
      teamId: 'team_id',
      currentStreak: 'current_streak',
      longestStreak: 'longest_streak',
      lastCompleted: 'last_completed',
      streakStart: 'streak_start',
      expiresAt: 'expires_at',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      password: 'password',
      avatar: 'avatar',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      resourceType: 'resource_type',
      resourceId: 'resource_id',
      eventType: 'event_type',
      fieldKey: 'field_key',
      fieldType: 'field_type',
      fieldValue: 'field_value',
      label: 'label',
      usageCount: 'usage_count',
      avgRating: 'avg_rating',
      isEnabled: 'is_enabled',
      triggerType: 'trigger_type',
      triggerValue: 'trigger_value',
      actionType: 'action_type',
      actionValue: 'action_value',
      notificationDays: 'notification_days',
      reminderLeadTime: 'reminder_lead_time',
      quietHoursStart: 'quiet_hours_start',
      quietHoursEnd: 'quiet_hours_end',
      isPublic: 'is_public',
      isNotified: 'is_notified',
      startedAt: 'started_at',
      completedAt: 'completed_at',
      estimateHours: 'estimate_hours',
      estimateMinutes: 'estimate_minutes',
      actualHours: 'actual_hours',
      actualMinutes: 'actual_minutes',
      deadline: 'deadline',
      reminderTime: 'reminder_time',
      recurringType: 'recurring_type',
      recurringInterval: 'recurring_interval',
      dependsOnId: 'depends_on_id',
      blockedTaskId: 'blocked_task_id',
    };
    // Copy common fields to map
    Object.entries(commonFields).forEach(([key, value]) => {
      map[key] = value;
    });
    return map;
  }

  /**
   * Find a single record by ID
   */
  findById(id: string): T | undefined {
    const query = this.buildSelectQuery() + ' WHERE id = ?';
    return this.db.prepare(query).get(id) as T | undefined;
  }

  /**
   * Find all records with optional pagination
   */
  findAll(options?: { limit?: number; offset?: number; orderBy?: string; order?: 'ASC' | 'DESC' }): T[] {
    let query = this.buildSelectQuery();

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.order || 'ASC'}`;
    }

    if (options?.limit !== undefined) {
      query += ` LIMIT ?`;
      if (options?.offset !== undefined) {
        query += ` OFFSET ?`;
        return this.db.prepare(query).all(options.limit, options.offset) as T[];
      }
      return this.db.prepare(query).all(options.limit) as T[];
    }

    return this.db.prepare(query).all() as T[];
  }

  /**
   * Create a new record
   */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Record<string, any>): T {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const fields = this.getObjectFields(data);
    // Convert camelCase to snake_case for database columns
    const dbFields = fields.map(f => this.fieldMap[f] || f);
    const placeholders = dbFields.map(() => '?').join(', ');
    const values = fields.map(f => data[f]);

    const query = `
      INSERT INTO ${this.tableName} (id, ${dbFields.join(', ')}${this.options.timestamps ? ', created_at, updated_at' : ''})
      VALUES (?, ${placeholders}${this.options.timestamps ? ', ?, ?' : ''})
    `;

    this.db.prepare(query).run(id, ...values, ...(this.options.timestamps ? [now, now] : []));

    return this.findById(id)!;
  }

  /**
   * Update a record
   */
  update(id: string, data: Partial<Omit<T, 'id'>> & Record<string, any>): T {
    const updates: string[] = [];
    const values: any[] = [];

    const fields = this.getObjectFields(data);
    for (const field of fields) {
      if (data[field] !== undefined) {
        // Use fieldMap for snake_case conversion
        const dbField = this.fieldMap[field] || field;
        updates.push(`${dbField} = ?`);
        values.push(data[field]);
      }
    }

    if (this.options.timestamps) {
      updates.push(`updated_at = ?`);
      values.push(new Date().toISOString());
    }

    values.push(id);

    const query = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`;
    this.db.prepare(query).run(...values);

    return this.findById(id)!;
  }

  /**
   * Delete a record (soft or hard)
   */
  delete(id: string): boolean {
    if (this.options.softDelete) {
      const now = new Date().toISOString();
      this.db.prepare(`UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE id = ?`)
        .run(now, now, id);
      return true;
    }
    this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    return true;
  }

  /**
   * Check if record exists
   */
  exists(id: string): boolean {
    return this.db.prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ?`)
      .get(id) !== undefined;
  }

  /**
   * Count records with optional filter
   */
  count(filters?: Record<string, any>): number {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const values: any[] = [];
    const conditions = this.buildWhereClause(filters);

    if (conditions.where) {
      query += ` WHERE ${conditions.where}`;
      values.push(...conditions.values);
    }

    return this.db.prepare(query).get(...values)?.count || 0;
  }

  /**
   * Execute a raw query
   */
  query<R = T>(sql: string, params: any[] = []): R[] {
    return this.db.prepare(sql).all(...params) as R[];
  }

  /**
   * Execute a raw query returning single result
   */
  queryOne<R = T>(sql: string, params: any[] = []): R | undefined {
    return this.db.prepare(sql).get(...params) as R | undefined;
  }

  // Protected helper methods

  protected buildSelectQuery(fields?: string[]): string {
    const selectFields = fields || ['*'];
    return `SELECT ${selectFields.join(', ')} FROM ${this.tableName}`;
  }

  protected buildWhereClause(filters?: Record<string, any>): { where: string; values: any[] } {
    if (!filters) return { where: '', values: [] };

    const conditions: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    return {
      where: conditions.join(' AND '),
      values,
    };
  }

  protected getObjectFields(obj: Record<string, any>): string[] {
    return Object.keys(obj).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt');
  }
}

/**
 * Transaction wrapper for multiple operations
 */
export class Transaction {
  private db = getDb();

  /**
   * Execute operations within a transaction
   */
  async execute<T>(fn: () => T): Promise<T> {
    const transaction = this.db.transaction();
    try {
      transaction.start();
      const result = fn();
      transaction.commit();
      return result;
    } catch (error) {
      transaction.rollback();
      throw error;
    }
  }

  /**
   * Execute operations within a transaction (sync version)
   */
  executeSync<T>(fn: () => T): T {
    const transaction = this.db.transaction();
    try {
      transaction.start();
      const result = fn();
      transaction.commit();
      return result;
    } catch (error) {
      transaction.rollback();
      throw error;
    }
  }
}

/**
 * Query Builder for complex queries
 */
export class QueryBuilder<T = any> {
  private table: string;
  private fields: string[] = ['*'];
  private conditions: string[] = [];
  private conditionValues: any[] = [];
  private orderByClause: string | undefined;
  private limitClause: number | undefined;
  private offsetClause: number | undefined;
  private db: any;

  constructor(table: string, database?: any) {
    this.table = table;
    this.db = database || getDb();
  }

  select(...fields: string[]): this {
    this.fields = fields.length ? fields : ['*'];
    return this;
  }

  where(field: string, operator: string, value: any): this {
    this.conditions.push(`${field} ${operator} ?`);
    this.conditionValues.push(value);
    return this;
  }

  andWhere(field: string, operator: string, value: any): this {
    this.conditions.push(`${field} ${operator} ?`);
    this.conditionValues.push(value);
    return this;
  }

  orWhere(field: string, operator: string, value: any): this {
    this.conditions[this.conditions.length - 1] += ` OR ${field} ${operator} ?`;
    this.conditionValues.push(value);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClause = `${field} ${direction}`;
    return this;
  }

  limit(count: number): this {
    this.limitClause = count;
    return this;
  }

  offset(count: number): this {
    this.offsetClause = count;
    return this;
  }

  build(): { sql: string; params: any[] } {
    let sql = `SELECT ${this.fields.join(', ')} FROM ${this.table}`;

    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`;
    }

    if (this.orderByClause) {
      sql += ` ORDER BY ${this.orderByClause}`;
    }

    if (this.limitClause !== undefined) {
      sql += ` LIMIT ?`;
    }

    if (this.offsetClause !== undefined) {
      sql += ` OFFSET ?`;
    }

    return {
      sql,
      params: [...this.conditionValues, ...(this.limitClause !== undefined ? [this.limitClause] : []), ...(this.offsetClause !== undefined ? [this.offsetClause] : [])],
    };
  }

  execute(): any[] {
    const { sql, params } = this.build();
    return this.db.prepare(sql).all(...params);
  }

  findAll(): any[] {
    return this.execute();
  }
}
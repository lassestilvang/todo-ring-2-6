/**
 * Audit Log Repository
 * Handles all database operations related to audit logs
 */

import { getDb } from '../../db/index';
import type { AuditLog } from '@/types/index';

export class AuditLogRepository {
  private db = getDb();

  findAll(limit: number = 100): AuditLog[] {
    return this.db.prepare(
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?'
    ).all(limit) as AuditLog[];
  }

  findById(id: string): AuditLog | undefined {
    return this.db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id) as AuditLog | undefined;
  }

  findByUserId(userId: string, limit: number = 100): AuditLog[] {
    return this.db.prepare(
      'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(userId, limit) as AuditLog[];
  }

  findByEventType(eventType: string, limit: number = 100): AuditLog[] {
    return this.db.prepare(
      'SELECT * FROM audit_logs WHERE event_type = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(eventType, limit) as AuditLog[];
  }

  create(data: {
    eventType: string;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
  }): AuditLog {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO audit_logs (id, event_type, user_id, resource_type, resource_id, ip_address, user_agent, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      data.eventType,
      data.userId || null,
      data.resourceType || null,
      data.resourceId || null,
      data.ipAddress || null,
      data.userAgent || null,
      data.details || null,
      now
    );

    return this.findById(id)!;
  }

  deleteById(id: string): void {
    this.db.prepare('DELETE FROM audit_logs WHERE id = ?').run(id);
  }

  deleteOlderThan(timestamp: string): void {
    this.db.prepare('DELETE FROM audit_logs WHERE timestamp < ?').run(timestamp);
  }
}

let auditLogRepository: AuditLogRepository | null = null;

export function getAuditLogRepository(): AuditLogRepository {
  if (!auditLogRepository) {
    auditLogRepository = new AuditLogRepository();
  }
  return auditLogRepository;
}
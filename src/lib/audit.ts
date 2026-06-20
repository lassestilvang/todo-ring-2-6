/**
 * Audit logging for security events
 */

import { getDb } from '@/db/index';

export type AuditEventType =
  | 'auth_success'
  | 'auth_failure'
  | 'auth_logout'
  | 'resource_access'
  | 'resource_create'
  | 'resource_update'
  | 'resource_delete'
  | 'permission_denied'
  | 'rate_limit_exceeded'
  | 'suspicious_activity';

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  options: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }
): Promise<void> {
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    db.prepare(
      `INSERT INTO audit_logs (id, event_type, user_id, resource_type, resource_id, ip_address, user_agent, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      eventType,
      options.userId || null,
      options.resourceType || null,
      options.resourceId || null,
      options.ipAddress || null,
      options.userAgent || null,
      options.details ? JSON.stringify(options.details) : null,
      timestamp
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    eventType?: AuditEventType;
    resourceType?: string;
    from?: string;
    to?: string;
    limit?: number;
  } = {}
): Promise<AuditEvent[]> {
  const db = getDb();
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.userId) {
    conditions.push('user_id = ?');
    values.push(filters.userId);
  }

  if (filters.eventType) {
    conditions.push('event_type = ?');
    values.push(filters.eventType);
  }

  if (filters.resourceType) {
    conditions.push('resource_type = ?');
    values.push(filters.resourceType);
  }

  if (filters.from) {
    conditions.push('timestamp >= ?');
    values.push(filters.from);
  }

  if (filters.to) {
    conditions.push('timestamp <= ?');
    values.push(filters.to);
  }

  let query = 'SELECT * FROM audit_logs';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY timestamp DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    values.push(filters.limit);
  }

  return db.prepare(query).all(...values) as AuditEvent[];
}

// Convenience functions
export const audit = {
  authSuccess: (userId: string, ip?: string, agent?: string) =>
    logAuditEvent('auth_success', { userId, ipAddress: ip, userAgent: agent }),

  authFailure: (userId: string, ip?: string, agent?: string, reason?: string) =>
    logAuditEvent('auth_failure', { userId, ipAddress: ip, userAgent: agent, details: { reason } }),

  authLogout: (userId: string, ip?: string, agent?: string) =>
    logAuditEvent('auth_logout', { userId, ipAddress: ip, userAgent: agent }),

  resourceAccess: (userId: string, resourceType: string, resourceId: string, ip?: string, agent?: string) =>
    logAuditEvent('resource_access', { userId, resourceType, resourceId, ipAddress: ip, userAgent: agent }),

  resourceCreate: (userId: string, resourceType: string, resourceId: string, ip?: string, agent?: string) =>
    logAuditEvent('resource_create', { userId, resourceType, resourceId, ipAddress: ip, userAgent: agent }),

  resourceUpdate: (userId: string, resourceType: string, resourceId: string, ip?: string, agent?: string) =>
    logAuditEvent('resource_update', { userId, resourceType, resourceId, ipAddress: ip, userAgent: agent }),

  resourceDelete: (userId: string, resourceType: string, resourceId: string, ip?: string, agent?: string) =>
    logAuditEvent('resource_delete', { userId, resourceType, resourceId, ipAddress: ip, userAgent: agent }),

  permissionDenied: (userId: string, resourceType: string, ip?: string, agent?: string, reason?: string) =>
    logAuditEvent('permission_denied', { userId, resourceType, ipAddress: ip, userAgent: agent, details: { reason } }),

  rateLimitExceeded: (ip: string, agent?: string) =>
    logAuditEvent('rate_limit_exceeded', { ipAddress: ip, userAgent: agent }),

  suspiciousActivity: (userId: string, ip?: string, agent?: string, details?: Record<string, any>) =>
    logAuditEvent('suspicious_activity', { userId, ipAddress: ip, userAgent: agent, details }),
};
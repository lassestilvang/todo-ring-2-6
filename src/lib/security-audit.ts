/**
 * Security audit logging for TaskPlanner
 * Comprehensive security event tracking and monitoring
 */

export enum SecurityEvent {
  LOGIN_ATTEMPT = 'login_attempt',
  AUTH_FAILURE = 'auth_failure',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_REVOKED = 'token_revoked',
  IP_MISMATCH = 'ip_mismatch',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PERMISSION_DENIED = 'permission_denied',
  DATA_ACCESS = 'data_access',
  ACCOUNT_LOCKOUT = 'account_lockout',
}

export interface SecurityMetadata {
  timestamp: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  [key: string]: unknown;
}

export interface SecurityAuditEntry {
  event: SecurityEvent;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: SecurityMetadata;
}

// In-memory storage (Production: Replace with Redis/Database)
const auditLog: SecurityAuditEntry[] = [];

/**
 * Log security event with metadata
 */
export function logSecurityEvent(event: SecurityEvent, metadata: SecurityMetadata = {}): void {
  const entry: SecurityAuditEntry = {
    event,
    severity: determineSeverity(event),
    metadata: {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ...metadata,
    },
  };

  auditLog.push(entry);

  // Production: Send to external logging service
  if (metadata.endpoint) {
    console.log(`[SECURITY] ${event}`, metadata);
  }
}

/**
 * Determine severity level based on event type
 */
function determineSeverity(event: SecurityEvent): SecurityAuditEntry['severity'] {
  const critical = [SecurityEvent.ACCOUNT_LOCKOUT, SecurityEvent.SUSPICIOUS_ACTIVITY];
  const high = [SecurityEvent.AUTH_FAILURE, SecurityEvent.TOKEN_REVOKED, SecurityEvent.IP_MISMATCH];
  const medium = [SecurityEvent.LOGIN_ATTEMPT, SecurityEvent.TOKEN_EXPIRED];
  const low = [SecurityEvent.RATE_LIMIT_EXCEEDED, SecurityEvent.PERMISSION_DENIED];

  if (critical.includes(event)) return 'critical';
  if (high.includes(event)) return 'high';
  if (medium.includes(event)) return 'medium';
  return 'low';
}

/**
 * Retrieve audit log entries
 */
export function getAuditLog(): SecurityAuditEntry[] {
  return auditLog;
}

/**
 * Clear audit log (for testing)
 */
export function clearAuditLog(): void {
  auditLog.length = 0;
}
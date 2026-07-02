/**
 * Standardized error codes for API responses
 *
 * Error codes follow a consistent naming pattern:
 * - UPPER_SNAKE_CASE
 * - Grouped by category
 * - Used for logging, monitoring, and client-side error handling
 *
 * @example
 * ```typescript
 * if (error.code === ErrorCodes.TASK_NOT_FOUND) {
 *   // Handle missing task
 * }
 * ```
 */

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for monitoring
export type ErrorCategory = 'authentication' | 'validation' | 'resource' | 'conflict' | 'rate_limit' | 'server' | 'business' | 'feature';

export const ErrorCodes = {
  // Authentication errors (AUTH_*)
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  MFA_REQUIRED: 'AUTH_MFA_REQUIRED',
  MFA_INVALID: 'AUTH_MFA_INVALID',

  // Validation errors (VAL_*)
  VALIDATION_ERROR: 'VAL_ERROR',
  INVALID_INPUT: 'VAL_INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'VAL_MISSING_FIELD',
  BAD_REQUEST: 'VAL_BAD_REQUEST',

  // Resource errors (RES_*)
  NOT_FOUND: 'RES_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RES_NOT_FOUND',
  TASK_NOT_FOUND: 'RES_TASK_NOT_FOUND',
  LIST_NOT_FOUND: 'RES_LIST_NOT_FOUND',
  LABEL_NOT_FOUND: 'RES_LABEL_NOT_FOUND',
  USER_NOT_FOUND: 'RES_USER_NOT_FOUND',
  TEAM_NOT_FOUND: 'RES_TEAM_NOT_FOUND',

  // Conflict errors (CONFLICT_*)
  CONFLICT: 'CONFLICT_ERROR',
  DUPLICATE: 'CONFLICT_DUPLICATE',
  CIRCULAR_DEPENDENCY: 'CONFLICT_CIRCULAR_DEPENDENCY',
  SCHEDULE_CONFLICT: 'CONFLICT_SCHEDULE',
  ALREADY_EXISTS: 'CONFLICT_ALREADY_EXISTS',

  // Rate limiting (RATE_*)
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (SERVER_*)
  INTERNAL_ERROR: 'SERVER_INTERNAL_ERROR',
  DATABASE_ERROR: 'SERVER_DATABASE_ERROR',
  NETWORK_ERROR: 'SERVER_NETWORK_ERROR',
  IMPORT_ERROR: 'SERVER_IMPORT_ERROR',
  EXPORT_ERROR: 'SERVER_EXPORT_ERROR',

  // Business logic errors (BUSINESS_*)
  CANNOT_COMPLETE: 'BUSINESS_CANNOT_COMPLETE',
  INVALID_OPERATION: 'BUSINESS_INVALID_OPERATION',
  INVALID_REQUEST: 'BUSINESS_INVALID_REQUEST',
  MAX_RECURRANCE_REACHED: 'BUSINESS_MAX_RECURRANCE',
  TASK_LOCKED: 'BUSINESS_TASK_LOCKED',

  // Focus session errors
  FOCUS_ERROR: 'FOCUS_SESSION_ERROR',

  // AI service errors
  AI_ERROR: 'AI_SERVICE_ERROR',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',

  // Calendar errors
  CALENDAR_ERROR: 'CALENDAR_ERROR',
  CALENDAR_CONNECT_ERROR: 'CALENDAR_CONNECT_ERROR',

  // Notification errors
  NOTIFICATION_ERROR: 'NOTIFICATION_ERROR',

  // Team collaboration errors
  TEAM_INVITE_PENDING: 'TEAM_INVITE_PENDING',
  TEAM_ACCESS_DENIED: 'TEAM_ACCESS_DENIED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Get human-readable error message for an error code
 */
export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    // Auth messages
    AUTH_UNAUTHORIZED: 'Authentication required',
    AUTH_FORBIDDEN: 'You do not have permission to access this resource',
    AUTH_INVALID_TOKEN: 'Invalid authentication token',
    AUTH_TOKEN_EXPIRED: 'Authentication token has expired',
    AUTH_MFA_REQUIRED: 'Multi-factor authentication required',
    AUTH_MFA_INVALID: 'Invalid verification code',

    // Validation messages
    VAL_ERROR: 'Validation failed',
    VAL_INVALID_INPUT: 'Invalid input provided',
    VAL_MISSING_FIELD: 'Required field is missing',
    VAL_BAD_REQUEST: 'Invalid request',

    // Resource messages
    RES_NOT_FOUND: 'Resource not found',
    RES_TASK_NOT_FOUND: 'Task not found',
    RES_LIST_NOT_FOUND: 'List not found',
    RES_LABEL_NOT_FOUND: 'Label not found',
    RES_USER_NOT_FOUND: 'User not found',
    RES_TEAM_NOT_FOUND: 'Team not found',

    // Conflict messages
    CONFLICT_ERROR: 'Resource conflict',
    CONFLICT_DUPLICATE: 'Resource already exists',
    CONFLICT_CIRCULAR_DEPENDENCY: 'Circular dependency detected',
    CONFLICT_SCHEDULE: 'Schedule conflict detected',
    CONFLICT_ALREADY_EXISTS: 'Resource already exists',

    // Rate limiting
    RATE_LIMITED: 'Too many requests. Please try again later.',

    // Server errors
    SERVER_INTERNAL_ERROR: 'An internal server error occurred',
    SERVER_DATABASE_ERROR: 'Database operation failed',
    SERVER_IMPORT_ERROR: 'Failed to import data',
    SERVER_EXPORT_ERROR: 'Failed to export data',
    SERVER_NETWORK_ERROR: 'Network error occurred',

    // Business logic
    BUSINESS_CANNOT_COMPLETE: 'Cannot complete this task',
    BUSINESS_INVALID_OPERATION: 'Invalid operation',
    BUSINESS_INVALID_REQUEST: 'Invalid request',
    BUSINESS_MAX_RECURRANCE: 'Maximum recurrence limit reached',
    BUSINESS_TASK_LOCKED: 'Task is currently being edited',

    // Feature-specific
    FOCUS_SESSION_ERROR: 'Focus session error',
    AI_SERVICE_ERROR: 'AI service error',
    AI_RATE_LIMITED: 'AI service rate limit exceeded',
    CALENDAR_ERROR: 'Calendar connection error',
    CALENDAR_CONNECT_ERROR: 'Failed to connect calendar',
    NOTIFICATION_ERROR: 'Notification error',
    TEAM_ACCESS_DENIED: 'Access denied to team resource',
    TEAM_INVITE_PENDING: 'Team invite is pending approval',
  };

  return messages[code] || 'An unknown error occurred';
}

/**
 * Error metadata for monitoring and logging
 */
export interface ErrorMetadata {
  severity: ErrorSeverity;
  category: ErrorCategory;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retryable: boolean;
}

/**
 * Get error metadata for monitoring
 */
export function getErrorMetadata(code: ErrorCode): ErrorMetadata {
  const authErrors = ['AUTH_UNAUTHORIZED', 'AUTH_FORBIDDEN', 'AUTH_INVALID_TOKEN', 'AUTH_TOKEN_EXPIRED', 'AUTH_MFA_REQUIRED', 'AUTH_MFA_INVALID'];
  const validationErrors = ['VAL_ERROR', 'VAL_INVALID_INPUT', 'VAL_MISSING_FIELD', 'VAL_BAD_REQUEST'];
  const rateLimitErrors = ['RATE_LIMITED'];
  const serverErrors = ['SERVER_INTERNAL_ERROR', 'SERVER_DATABASE_ERROR', 'SERVER_NETWORK_ERROR', 'SERVER_IMPORT_ERROR', 'SERVER_EXPORT_ERROR'];

  if (authErrors.includes(code)) {
    return { severity: 'medium', category: 'authentication', logLevel: 'warn', retryable: false };
  }
  if (validationErrors.includes(code)) {
    return { severity: 'low', category: 'validation', logLevel: 'info', retryable: false };
  }
  if (rateLimitErrors.includes(code)) {
    return { severity: 'low', category: 'rate_limit', logLevel: 'info', retryable: true };
  }
  if (serverErrors.includes(code)) {
    return { severity: 'high', category: 'server', logLevel: 'error', retryable: true };
  }

  return { severity: 'medium', category: 'business', logLevel: 'warn', retryable: false };
}

/**
 * Create a structured API error
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      ...(this.metadata && { details: this.metadata }),
    };
  }
}
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

  // Rate limiting (RATE_*)
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (SERVER_*)
  INTERNAL_ERROR: 'SERVER_INTERNAL_ERROR',
  DATABASE_ERROR: 'SERVER_DATABASE_ERROR',
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

    // Rate limiting
    RATE_LIMITED: 'Too many requests. Please try again later.',

    // Server errors
    SERVER_INTERNAL_ERROR: 'An internal server error occurred',
    SERVER_DATABASE_ERROR: 'Database operation failed',
    SERVER_IMPORT_ERROR: 'Failed to import data',
    SERVER_EXPORT_ERROR: 'Failed to export data',

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
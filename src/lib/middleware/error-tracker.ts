import { NextRequest } from 'next/server';

/**
 * Error tracking middleware
 * Logs errors to console and optionally to external service (Sentry, LogRocket, etc.)
 */
class ErrorTracker {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ERROR_TRACKING_ENABLED === 'true';
  }

  /**
   * Track an error
   */
  track(error: Error, context?: {
    userId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
  }) {
    // Always log to console
    console.error('[ErrorTracker]', {
      message: error.message,
      stack: error.stack,
      ...context
    });

    // External error tracking service (placeholder)
    if (this.enabled && process.env.SENTRY_DSN) {
      // Future: Implement Sentry integration
      this.sendToExternalService(error, context);
    }

    // Log to database for AI-specific errors
    if (context?.endpoint?.includes('ai-assistant')) {
      this.logAIError(error, context);
    }
  }

  /**
   * Log AI-specific errors
   */
  private logAIError(error: Error, context: { userId?: string; endpoint?: string; }) {
    try {
      // Import db dynamically to avoid circular dependency
      const { getDb } = require('@/db/db-client');
      const db = getDb();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ai_errors (id, error_message, error_stack, user_id, endpoint, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        error.message,
        error.stack || null,
        context.userId || 'anonymous',
        context.endpoint || null,
        now
      );
    } catch (e) {
      // Don't let error logging fail silently
      console.error('Failed to log AI error to DB:', e);
    }
  }

  /**
   * Send to external tracking service
   */
  private async sendToExternalService(error: Error, context?: any) {
    // Placeholder for Sentry/LogRocket integration
    // Implementation would use the respective SDK
    if (process.env.SENTRY_DSN) {
      // Example Sentry integration would go here
    }
  }
}

export const errorTracker = new ErrorTracker();

/**
 * Error tracking middleware wrapper
 */
export function withErrorTracking(handler: Function) {
  return async function(req: NextRequest) {
    try {
      return await handler(req);
    } catch (error) {
      errorTracker.track(error as Error, {
        userId: req.headers.get('x-user-id') || undefined,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        userAgent: req.headers.get('user-agent') || undefined
      });

      throw error; // Re-throw to let API layer handle
    }
  };
}
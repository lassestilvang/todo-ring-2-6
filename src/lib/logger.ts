/**
 * Structured Logger with Request Tracing
 * Provides correlation IDs, structured logs, and contextual logging
 */

import winston from 'winston';
import { randomUUID } from 'crypto';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  resource?: string;
  action?: string;
  duration?: number;
  [key: string]: any;
}

// Create logger with structured format
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.condenseInline(),
  defaultMeta: { service: 'taskplanner' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      tailable: true
    })
  ]
});

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext = {}) {
  return logger.child(context);
}

/**
 * Request context manager
 * Tracks request lifecycle with timing and correlation
 */
export class RequestContext {
  private logger: winston.Logger;
  private requestId: string;
  private startTime: number;

  constructor(context: LogContext = {}) {
    this.requestId = context.requestId || generateRequestId();
    this.startTime = Date.now();
    this.logger = logger.child({
      requestId: this.requestId,
      ...context
    });
  }

  getRequestId(): string {
    return this.requestId;
  }

  info(message: string, meta?: LogContext) {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: LogContext) {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: LogContext) {
    const errorMeta = error instanceof Error
      ? { ...meta, error: error.message, stack: error.stack }
      : { ...meta, error };
    this.logger.error(message, errorMeta);
  }

  debug(message: string, meta?: LogContext) {
    this.logger.debug(message, meta);
  }

  /**
   * Log request completion with duration
   */
  end(statusCode: number, meta?: LogContext) {
    const duration = Date.now() - this.startTime;
    this.info('Request completed', {
      statusCode,
      duration,
      ...meta
    });
  }

  /**
   * Log request failure
   */
  fail(error: Error, meta?: LogContext) {
    const duration = Date.now() - this.startTime;
    this.error('Request failed', error, { duration, ...meta });
  }
}

// Express-like middleware for request logging
export function createRequestMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const ctx = new RequestContext({
      requestId: req.headers['x-request-id'] as string || generateRequestId(),
      userId: req.user?.id,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });

    // Add to request object
    (req as any).logContext = ctx;

    // Log request start
    ctx.debug('Request started');

    // Log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      ctx.end(res.statusCode);
      return originalEnd.apply(this, args);
    };

    next();
  };
}

// Export default logger
export default logger;
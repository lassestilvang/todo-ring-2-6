/**
 * SQL Injection detection and database security utilities
 * Advanced SQLi protection with Zod validation schemas
 */

import { z } from 'zod';

/**
 * SQL Injection detection patterns
 * Covers encoding bypasses, heuristic attacks, and common payloads
 */
export function detectSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const inputLower = input.toLowerCase();

  // Encoding bypass patterns
  const encodingPatterns = [
    /(%27|'|\\')/i, // Single quote encoding
    /(%22|"|\\")/i, // Double quote encoding
    /(%3B|;|\\;)/i, // Semicolon encoding
    /(--|%2D%2D)/i, // SQL comment encoding
    /(#|%23)/i, // Hash comment encoding
    /(\/\*|\*\/)/i, // Multi-line comment markers
    /(%00|\\0)/i, // Null byte injection
    /(%0A|\\n)/i, // Newline injection
    /(%0D|\\r)/i, // Carriage return injection
  ];

  // SQL keyword detection with context
  const sqlKeywords = [
    '\\bunion\\b', '\\bselect\\b', '\\binsert\\b', '\\bupdate\\b',
    '\\bdelete\\b', '\\bdrop\\b', '\\bcreate\\b', '\\balter\\b',
    '\\bexec\\b', '\\bexecute\\b', '\\btruncate\\b', '\\bmerge\\b',
    '\\bdeclare\\b', '\\binto\\b', '\\bvalues\\b', '\\bset\\b'
  ];

  // Advanced attack patterns
  const attackPatterns = [
    /or\s+1\s*=\s*1/i, // Basic tautology
    /or\s+'a'\s*=\s*'a'/i, // String tautology
    /\bwaitfor\s+delay\b/i, // Time-based attack
    /\bsleep\s*\(\s*\d+\s*\)/i, // Sleep function
    /\bbenchmark\s*\(/i, // Benchmark function
    /\blike\s+['"]%/i, // Wildcard injection
    /\bexec\s+xp_cmdshell/i, // Command execution
    /\binto\s+(dumpfile|outfile)/i, // File system access
  ];

  return encodingPatterns.some(p => p.test(input)) ||
         sqlKeywords.some(k => new RegExp(k, 'i').test(inputLower)) ||
         attackPatterns.some(p => p.test(input));
}

/**
 * Secure database validation using Zod schemas
 * Ensures type safety and prevents injection through strict validation
 */
export function sanitizeForDb<T>(data: T, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Log security violation for audit trail
    const firstError = result.error.errors[0];
    console.error('[SECURITY] Database validation failed:', {
      field: firstError.path.join('.'),
      message: firstError.message,
      received: data
    });

    throw new Error(`Invalid database input: ${firstError.message}`);
  }

  return result.data;
}

/**
 * Schema definitions for common database entities
 */
export const dbSchemas = {
  // User entity schema
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().max(100),
    passwordHash: z.string().min(60), // bcrypt hash length
    role: z.enum(['admin', 'user', 'viewer']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional()
  }),

  // Task entity schema
  task: z.object({
    id: z.string().uuid(),
    title: z.string().max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    listId: z.string().uuid().nullable(),
    dueDate: z.string().date().optional(),
    estimatedHours: z.number().min(0).max(999).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional()
  }),

  // List entity schema
  taskList: z.object({
    id: z.string().uuid(),
    name: z.string().max(100),
    description: z.string().max(500).optional(),
    ownerId: z.string().uuid(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    isArchived: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional()
  }),

  // Pagination schema
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
};

/**
 * Validate and sanitize SQL identifiers (table/column names)
 * Prevents SQL injection through identifier manipulation
 */
export function validateSqlIdentifier(name: string): string {
  // Only allow alphanumeric and underscore, starting with letter
  const identifierRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;

  if (!identifierRegex.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }

  // Length restriction to prevent DoS
  if (name.length > 64) {
    throw new Error(`SQL identifier too long: ${name}`);
  }

  return name;
}

/**
 * Build parameterized query safely
 * Usage: const query = buildSafeQuery('SELECT * FROM users WHERE id = ?', [userId]);
 */
export function buildSafeQuery(template: string, params: unknown[]): { query: string; values: unknown[] } {
  // Basic validation - in production, use a proper query builder
  if (template.includes(';;') || template.includes('--')) {
    throw new Error('Invalid query template');
  }

  return {
    query: template,
    values: params
  };
}
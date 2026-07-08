/**
 * Input sanitization utilities
 */

import sanitizeFn from 'xss';
import { z } from 'zod';

// XSS configuration
const xssOptions = {
  whiteList: {
    // Allow safe HTML tags
    'b': [],
    'i': [],
    'em': [],
    'strong': [],
    'span': ['style', 'class'],
    'div': ['class'],
    'p': [],
    'br': [],
    'ul': [],
    'ol': [],
    'li': [],
    'h1': [],
    'h2': [],
    'h3': [],
    'a': ['href', 'title'],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe'],
};

// SQL Injection prevention patterns
const SQL_DANGEROUS_PATTERNS = [
  /('|(\')|(;)|(\;)|(\|\|)|(\&\&)|(\*\*)|(#)|(--)|(\/\*)|(\*\/)|(\@)|(!)|(\=)|(\;)|(\|)|(\^)|(\~)|(\`)|(\/\/)/gi,
  /(union|select|insert|update|delete|drop|create|alter|exec|execute|truncate)/gi,
  /(waitfor|delay|benchmark|sleep|load_file|outfile|into\s+dumpfile)/gi,
];

/**
 * Detect potential SQL injection in user input
 */
export function detectSqlInjection(input: string): boolean {
  return SQL_DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize input for safe SQL operations
 * Uses parameterized queries internally, but provides defense-in-depth
 */
export function sqlEscape(input: string): string {
  // Double any single quotes
  return input.replace(/'/g, "''");
}

/**
 * Validate that all object keys are safe SQL identifiers
 */
export function validateIdentifiers(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    const result = SafeIdentifierSchema.safeParse(key);
    if (!result.success) {
      throw new Error(`Unsafe SQL identifier detected: ${key}`);
    }
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return sanitizeFn(input, xssOptions);
}

/**
 * Sanitize an object's string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = { ...obj };

  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeInput(result[key]);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeObject(result[key]);
    }
  }

  return result;
}

/**
 * Validate and sanitize a string field
 */
export function sanitizeString(
  value: unknown,
  options: {
    max?: number;
    required?: boolean;
    defaultValue?: string;
  } = {}
): string {
  if (value === undefined || value === null) {
    if (options.required) {
      throw new Error('This field is required');
    }
    return options.defaultValue || '';
  }

  let str = String(value).trim();

  // Sanitize
  str = sanitizeInput(str);

  // Enforce max length
  if (options.max && str.length > options.max) {
    throw new Error(`Maximum length is ${options.max} characters`);
  }

  return str;
}

/**
 * Validate and sanitize a number field
 */
export function sanitizeNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
    defaultValue?: number;
  } = {}
): number {
  if (value === undefined || value === null) {
    if (options.required) {
      throw new Error('This field is required');
    }
    return options.defaultValue || 0;
  }

  const num = Number(value);

  if (isNaN(num)) {
    throw new Error('Invalid number');
  }

  if (options.min !== undefined && num < options.min) {
    throw new Error(`Minimum value is ${options.min}`);
  }

  if (options.max !== undefined && num > options.max) {
    throw new Error(`Maximum value is ${options.max}`);
  }

  return num;
}

/**
 * Validate and sanitize a UUID
 */
export function sanitizeUuid(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const str = String(value).trim();

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(str)) {
    return null;
  }

  return str;
}

/**
 * Validate and sanitize a date string
 */
export function sanitizeDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const str = String(value).trim();

  // Try to parse as date
  const date = new Date(str);

  if (isNaN(date.getTime())) {
    return null;
  }

  return str;
}

/**
 * Safe SQL identifier sanitization with Zod validation
 * Only allows alphanumeric characters and underscores
 */
export const SafeIdentifierSchema = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).max(64);

export const PositiveIntSchema = z.number().int().positive();

/**
 * Validate SQL identifier and throw if unsafe
 */
export function validateIdentifier(name: string): string {
  const result = SafeIdentifierSchema.safeParse(name);
  if (!result.success) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return result.data;
}

/**
 * Validate UUID with Zod
 */
export const UuidSchema = z.string().uuid();

/**
 * Validate task data for SQL operations
 */
export const TaskUpdateSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']).optional(),
  listId: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
}).strict();

/**
 * Sanitize and validate data for database operations
 */
export function sanitizeForDb<T>(data: T, schema?: z.ZodSchema<T>): T {
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(`Validation failed: ${firstError.message}`);
    }
    return result.data;
  }
  return data;
}
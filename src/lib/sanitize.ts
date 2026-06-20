/**
 * Input sanitization utilities
 */

import sanitizeFn from 'xss';

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
/**
 * Database security utilities
 * Password hashing and DB validation
 */

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sanitizeForDb, validateSqlIdentifier } from './sanitize-sql';

/**
 * Secure password hashing with bcrypt
 * @param password Plaintext password
 * @param saltRounds Number of BCrypt rounds (default: 12)
 * @returns Hashed password
 */
export async function hashPassword(password: string, saltRounds = 12): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare plaintext password with stored hash
 * @param password To compare
 * @param hashed Stored hash
 * @returns true if matches
 */
export async function comparePasswords(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

/**
 * Validate and sanitize data for database operations
 * Uses Zod schemas to enforce type safety and security
 * @param data Input data
 * @param schema Zod schema for validation
 * @returns Sanitized data
 */
export function sanitizeForDb<T>(data: T, schema: z.ZodSchema<T>): T {
  return sanitizeForDb(data, schema);
}

/**
 * Validate SQL identifiers (table/column names)
 * Prevents injection through manipulated names
 * @param name Identifier to validate
 * @returns Sanitized name
 */
export function validateSqlIdentifier(name: string): string {
  const identifierRegex = /^[a-zA-Z][a-zA-Z0-9_]{1,63}$/;
  if (!identifierRegex.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return name;
}
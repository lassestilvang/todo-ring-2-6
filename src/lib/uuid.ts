import { randomUUID } from 'crypto';

/**
 * Generate a UUID v4
 */
export const v4 = randomUUID;
export const uuid = randomUUID;
export const generateUUID = randomUUID;

/**
 * Generate multiple UUIDs
 */
export function generateUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => randomUUID());
}

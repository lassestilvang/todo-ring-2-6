/**
 * Database initialization helper for API routes
 * Ensures the database is initialized before handling requests
 */
import { initDb } from '@/db/index';

let dbInitialized = false;

export function ensureDbInitialized(): void {
  if (!dbInitialized) {
    try {
      initDb();
      dbInitialized = true;
    } catch (e) {
      // Already initialized or other error - safe to ignore
    }
  }
}
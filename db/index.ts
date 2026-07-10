// Re-export from db-client for backwards compatibility
export { getDb, injectDb, resetDb, initDb, closeDb } from './db-client';

// Re-export from operations for test compatibility
export * from './operations';

// Re-export repository pattern from src/lib/repositories (enhanced version)
export * from '../src/lib/repositories';
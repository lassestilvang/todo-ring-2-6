// Test database utilities using in-memory store
// This approach avoids native binding issues with better-sqlite3

export function setupTestDb() {
  // Set test mode environment variable
  process.env.TEST_MODE = 'true';
}

export async function closeTestDb() {
  // Reset test mode
  delete process.env.TEST_MODE;
}

export function teardownTestDb() {
  // Reset test mode
  delete process.env.TEST_MODE;
}

export function clearAllTables() {
  // No-op for mock-based tests
}

export function getTestDb() {
  // Return a mock database object
  return null;
}

// Set test mode BEFORE importing db modules
process.env.TEST_MODE = 'true';
export { initDb, getDb, injectDb, resetDb } from '../db/index';
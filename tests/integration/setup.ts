/**
 * Integration Test Setup
 *
 * Sets up the database for integration tests with native SQLite bindings.
 * This file runs before each test file and initializes the in-memory database.
 *
 * IMPORTANT: The native bindings for better-sqlite3 must be compiled for your
 * current Node.js version. If you see "Could not locate the bindings file" errors,
 * run: npm install better-sqlite3 --build-from-source
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global database instance for all tests
let db: any = null;
let dbInitialized = false;

export function setupIntegrationTests() {
  // Skip if already initialized (for test files that don't need DB)
  if (dbInitialized) return null;

  try {
    // Dynamic import to handle cases where native bindings aren't available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');

    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Load and execute schema
    const fs = require('fs');
    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const tx = db.transaction(() => {
      for (const stmt of statements) {
        db.prepare(stmt).run();
      }
    });
    tx();

    // Inject into db-client
    const { injectDb } = require('../../db/db-client');
    injectDb(db);

    dbInitialized = true;
    return db;
  } catch (error) {
    // Native bindings not available - tests that need DB will be skipped
    console.warn('Warning: Could not initialize SQLite database for integration tests.');
    console.warn('To enable database integration tests, run: npm install better-sqlite3 --build-from-source');
    return null;
  }
}

export function closeIntegrationDb() {
  if (db) {
    try {
      db.close();
    } catch (e) {
      // Ignore errors on close
    }
    db = null;
    dbInitialized = false;

    try {
      const { resetDb } = require('../../db/db-client');
      resetDb();
    } catch (e) {
      // Ignore errors
    }
  }
}

export function clearAllTables() {
  if (!db) return;

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  for (const table of tables) {
    if (!['sqlite_sequence', 'sqlite_master'].includes(table.name)) {
      db.prepare(`DELETE FROM ${table.name}`).run();
    }
  }
}

// Export for use in test files
export { };

// Global setup hook for Vitest
beforeAll(() => {
  setupIntegrationTests();
});

// Global teardown hook for Vitest
afterAll(() => {
  closeIntegrationDb();
});

// Clear tables before each test
beforeEach(() => {
  clearAllTables();
});
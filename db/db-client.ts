/**
 * Database client module
 * Provides database access with support for dependency injection in tests
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.sqlite');
const TEST_MODE = process.env.TEST_MODE === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let injectedDb: any = null;

export function injectDb(mockDb: any) {
  injectedDb = mockDb;
}

export function resetDb() {
  db = null;
  injectedDb = null;
}

export function getDb() {
  if (injectedDb) {
    return injectedDb;
  }
  if (!db) {
    db = TEST_MODE ? new Database(':memory:') : new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();

  // Check if tables already exist (for test mode)
  const existingTables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  if (existingTables.length > 0) {
    return database;
  }

  const schema = database.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');

  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  const tx = database.transaction(() => {
    for (const stmt of statements) {
      database.prepare(stmt).run();
    }
  });

  tx();

  // Migration: Add reminder_time column if it doesn't exist
  const tableInfo = database.prepare('PRAGMA table_info(tasks)').all() as { name: string }[];
  const hasReminderTime = tableInfo.some((col: { name: string }) => col.name === 'reminder_time');
  if (!hasReminderTime) {
    database.prepare('ALTER TABLE tasks ADD COLUMN reminder_time TEXT').run();
    console.log('Migration: Added reminder_time column to tasks table');
  }

  console.log('Database initialized successfully');
  return database;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
  if (injectedDb) {
    injectedDb = null;
  }
}
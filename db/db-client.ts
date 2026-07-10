import { Database } from 'better-sqlite3';
import path from 'path';
import { promises as fs } from 'fs';

const DB_PATH = path.join(process.cwd(), 'db', 'test.sqlite');

/**
 * Database client singleton
 */
class DatabaseClient {
  private static instance: any;
  private static initialized = false;
  private static dbInstance: any;

  static async init() {
    if (this.initialized) return;

    const dbDir = path.dirname(__filename);
    await fs.mkdir(path.dirname(__filename) + '/../db', { recursive: true });

    const db = new Database(DB_PATH);
    await db.init();
    console.log('Database initialized at', DB_PATH);

    this.dbInstance = db;
    this.initialized = true;
  }

  static getInstance() {
    if (!this.dbInstance) {
      this.init();
    }
    return this.dbInstance;
  }

  static get db() {
    if (!this.dbInstance) {
      this.init();
    }
    return this.dbInstance;
  }
}

/**
 * Get the current database instance
 */
export async function getDb() {
  return DatabaseClient.getInstance();
}

/**
 * Initialize the database
 */
export async function initDb() {
  return await DatabaseClient.init();
}

/**
 * Close the database connection
 */
export async function closeDb() {
  if (DatabaseClient.dbInstance) {
    await DatabaseClient.dbInstance.close();
  }
}

/**
 * Inject a mock database for testing
 */
export function injectDb(dbInstance: any) {
  DatabaseClient.dbInstance = dbInstance;
  return true;
}

/**
 * Reset the database connection
 */
export function resetDb() {
  return true;
}
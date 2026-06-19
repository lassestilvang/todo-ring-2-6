/**
 * Database Migration Runner
 * Tracks and applies migrations automatically
 */
import { getDb } from '../db-client';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface Migration {
  name: string;
  sql: string;
  appliedAt: string;
}

/**
 * Get all migrations from the migrations directory
 */
function getMigrations(): Migration[] {
  const migrationsDir = join(process.cwd(), 'db', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    return {
      name: file.replace('.sql', ''),
      sql,
      appliedAt: new Date().toISOString()
    };
  });
}

/**
 * Create the migrations table if it doesn't exist
 */
function ensureMigrationTable(db: ReturnType<typeof getDb>): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

/**
 * Get list of already applied migrations
 */
function getAppliedMigrations(db: ReturnType<typeof getDb>): Set<string> {
  const rows = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
  return new Set(rows.map(r => r.name));
}

/**
 * Mark a migration as applied
 */
function markMigrationApplied(db: ReturnType<typeof getDb>, name: string, appliedAt: string): void {
  db.prepare('INSERT OR REPLACE INTO migrations (name, applied_at) VALUES (?, ?)')
    .run(name, appliedAt);
}

/**
 * Run all pending migrations
 */
export function runMigrations(): { applied: string[]; errors: string[] } {
  const db = getDb();
  const result = { applied: [] as string[], errors: [] as string[] };

  try {
    ensureMigrationTable(db);
    const appliedMigrations = getAppliedMigrations(db);
    const migrations = getMigrations();

    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.name)) {
        try {
          // Split SQL by statements and execute each
          const statements = migration.sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          for (const statement of statements) {
            db.exec(statement);
          }

          markMigrationApplied(db, migration.name, migration.appliedAt);
          result.applied.push(migration.name);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`${migration.name}: ${msg}`);
        }
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Migration runner error: ${msg}`);
  }

  return result;
}

/**
 * Check if migrations are up to date
 */
export function isMigrationUpToDate(): boolean {
  const db = getDb();
  ensureMigrationTable(db);

  const migrations = getMigrations();
  const appliedMigrations = getAppliedMigrations(db);

  return migrations.every(m => appliedMigrations.has(m.name));
}
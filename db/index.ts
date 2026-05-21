import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.sqlite');

let db = null;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const db = getDb();
  const schema = db.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const tx = db.transaction(() => {
    for (const stmt of statements) {
      db.prepare(stmt).run();
    }
  });
  
  tx();
  console.log('Database initialized successfully');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Initialize on import if not in test mode
if (process.env.NODE_ENV !== 'test') {
  initDb();
}
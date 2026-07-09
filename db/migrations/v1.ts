import { DB } from 'better-sqlite3';
import { generateUUID } from './utils';

const db = new DB('./db.sqlite');

export async function up() {
  await db.exec(`CREATE TABLE IF NOT EXISTS stash (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_id ON stash(user_id);');
}

// This is required for down method in migration system
async function down() {
  await db.exec('DROP TABLE IF EXISTS stash');
}

export { up, down };
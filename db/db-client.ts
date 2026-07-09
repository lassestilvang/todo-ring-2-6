import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.resolve(path.dirname(import.meta.url), '..', 'db', 'test.sqlite');

export async function initDB() {
  const dbDir = path.dirname(DB_PATH);
  await fs.mkdir(dbDir, { recursive: true });

  const db = new Database(DB_PATH);
  await db.init();
  console.log('Database initialized at', DB_PATH);
  return db;
}
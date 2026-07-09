import { getDb } from '../db/db-client.js';
import { promises as fs } from 'fs';

async function initDB() {
  const dbPath = './db/test.sqlite';

  // Create directory structure if it doesn't exist
  await fs.mkdir('./db', { recursive: true });

  // Ensure the file exists
  await fs.open(dbPath, 'a');

  // Initialize database
  const db = getDb(dbPath);
  await db.init();

  console.log('Successfully initialized test database at:', dbPath);
}

initDB().catch(console.error);
import { DBClient } from '../src/lib/db/db-client.ts';
import { promises as fs } from 'fs';
import { resolve } from 'path';

async function initDB() {
  const dbPath = resolve(process.cwd(), 'db', 'test.sqlite');
  await fs.mkdir(resolve(process.cwd(), 'db'), { recursive: true });
  await fs.open(dbPath, 'a');

  const db = new DBClient(dbPath);
  await db.init();

  console.log('Database initialized at', dbPath);
}

initDB().catch(console.error);
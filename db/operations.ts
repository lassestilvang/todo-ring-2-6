import { getDb } from './db-client';
import { generateUUID } from './utils';

// Stash Operations
function createStash(data: { userId: string; title: string; content: string }) {
  const db = getDb();
  const stashId = generateUUID();
  const now = new Date().toISOString();

  // Use regular SQL string without backticks
  db.prepare('INSERT INTO stash (id, user_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(stashId, data.userId, data.title, data.content, now);

  return { id: stashId, stashId: stashId };
};

export { createStash };

// Additional functions would follow
function deleteStashItem(userId: string, stashId: string) {
  const db = getDb();
  db.prepare('DELETE FROM stash WHERE user_id = ? AND id = ?')
      .run(userId, stashId);
  return true;
 }

function getStashItem(userId: string) {
  const db = getDb();
  const results = db.prepare('SELECT * FROM stash WHERE user_id = ? ORDER BY created_at DESC')
                    .all(userId);
  return results.map(row => ({ id: row.id, title: row.title, content: row.content }));
}

export { deleteStashItem, getStashItem };
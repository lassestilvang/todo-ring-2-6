// Database initialization script
// Run with: node --experimental-strip-types scripts/init-db.mjs

import { initDb, closeDb } from '../db/index.js';

initDb();
console.log('✅ Database initialized successfully');
closeDb();
import { Database } from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'db', 'test.sqlite');

export class DBClient {
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  get db() {
    return this.db;
  }

  async init() {
    this.db.resultsFormat = Databaseผล";
    try {
      this.db.exec(""
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) NOT NULL,
          priority TEXT CHECK(priority IN ('low', 'medium', 'high')) NOT NULL,
          dependencies TEXT,
          tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
      );
      this.db.exec("CREATE INDEX idx_status ON tasks(status)");
    } catch (error) {
      console.error('Database initialization failed:', error.message);
      throw error;
    }
  }

  close() {
    this.db.close();
  }
}

/**
 * IndexedDB cache for offline support
 * Provides client-side caching for tasks, lists, and labels
 */

const DB_NAME = 'TaskPlannerDB';
const DB_VERSION = 1;

interface TaskCache {
  id: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

interface CacheOptions {
  expiresInMs?: number; // Expiration time in milliseconds
}

class DbCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event as IDBVersionChangeEvent).target?.result as IDBDatabase;

        // Create stores for each entity type
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });

        const listStore = db.createObjectStore('lists', { keyPath: 'id' });

        const labelStore = db.createObjectStore('labels', { keyPath: 'id' });

        const metaStore = db.createObjectStore('meta', { keyPath: 'key' });
      };
    });
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readwrite');
      const store = transaction.objectStore('meta');

      const cacheEntry: TaskCache = {
        id: key,
        data: value,
        timestamp: Date.now(),
        expiresAt: options.expiresInMs ? Date.now() + options.expiresInMs : undefined,
      };

      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readonly');
      const store = transaction.objectStore('meta');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as TaskCache | undefined;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check expiration
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data as T);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readwrite');
      const store = transaction.objectStore('meta');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meta'], 'readwrite');
      const store = transaction.objectStore('meta');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Task-specific methods
  async setTasks(tasks: any[]): Promise<void> {
    await this.set('tasks', tasks, { expiresInMs: 1000 * 60 * 5 }); // 5 minutes
  }

  async getTasks(): Promise<any[] | null> {
    return this.get<any[]>('tasks');
  }

  // Lists-specific methods
  async setLists(lists: any[]): Promise<void> {
    await this.set('lists', lists);
  }

  async getLists(): Promise<any[] | null> {
    return this.get<any[]>('lists');
  }

  // Labels-specific methods
  async setLabels(labels: any[]): Promise<void> {
    await this.set('labels', labels);
  }

  async getLabels(): Promise<any[] | null> {
    return this.get<any[]>('labels');
  }
}

// Singleton instance
let dbCache: DbCache | null = null;

export function getDbCache(): DbCache {
  if (!dbCache) {
    dbCache = new DbCache();
  }
  return dbCache;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  getDbCache().init().catch(console.error);
}
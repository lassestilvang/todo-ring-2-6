/**
 * IndexedDB-based Offline Cache for TaskPlanner
 * Provides local-first data persistence with background sync
 */

import { randomUUID } from 'crypto';

interface DBSchema {
  tasks: Task;
  lists: List;
  labels: Label;
  subtasks: Subtask;
  comments: Comment;
  settings: Setting;
}

interface Task {
  id: string;
  title: string;
  description: string;
  listId: string;
  date: string;
  deadline: string;
  priority: string;
  status: string;
  completedAt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isDeleted: boolean;
}

interface List {
  id: string;
  name: string;
  color: string;
  emoji: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isDeleted: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isDeleted: boolean;
}

interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isDeleted: boolean;
}

interface Comment {
  id: string;
  taskId: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
}

interface Setting {
  key: string;
  value: any;
  updatedAt: string;
}

const DB_NAME = 'TaskPlannerDB';
const DB_VERSION = 1;

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'task' | 'list' | 'label' | 'subtask' | 'comment';
  entityId: string;
  data: any;
  attempts: number;
  createdAt: number;
}

class OfflineCache {
  private db: IDBDatabase | null = null;
  private syncQueue: SyncQueueItem[] = [];

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        const stores = ['tasks', 'lists', 'labels', 'subtasks', 'comments', 'settings', 'sync_queue'];

        for (const storeName of stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt');
            store.createIndex('isDirty', 'isDirty');
          }
        }

        // Sync queue store
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('entityType', 'entityType');
        queueStore.createIndex('createdAt', 'createdAt');
      };
    });
  }

  // Task operations
  async saveTask(task: Partial<Task>): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['tasks'], 'readwrite');
    const store = tx.objectStore('tasks');

    const fullTask: Task = {
      id: task.id || randomUUID(),
      title: task.title || '',
      description: task.description || '',
      listId: task.listId || '',
      date: task.date || '',
      deadline: task.deadline || '',
      priority: task.priority || 'none',
      status: task.status || 'pending',
      completedAt: task.completedAt || '',
      sortOrder: task.sortOrder || 0,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDirty: true,
      isDeleted: false,
    };

    await store.put(fullTask);
  }

  async getTask(id: string): Promise<Task | null> {
    if (!this.db) return null;

    const tx = this.db.transaction(['tasks'], 'readonly');
    const store = tx.objectStore('tasks');
    return await store.get(id);
  }

  async getTasks(limit?: number): Promise<Task[]> {
    if (!this.db) return [];

    const tx = this.db.transaction(['tasks'], 'readonly');
    const store = tx.objectStore('tasks');
    const index = store.index('updatedAt');

    const cursorRequest = limit
      ? index.openCursor(null, 'prev')
      : index.openCursor();

    const tasks: Task[] = [];
    return new Promise((resolve) => {
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && tasks.length < (limit || Infinity)) {
          if (!cursor.value.isDeleted) {
            tasks.push(cursor.value);
          }
          cursor.continue();
        }
        resolve(tasks);
      };
    });
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) return;

    const task = await this.getTask(id);
    if (task) {
      const tx = this.db.transaction(['tasks'], 'readwrite');
      const store = tx.objectStore('tasks');
      await store.put({ ...task, isDeleted: true, isDirty: true });
    }
  }

  // List operations
  async saveList(list: Partial<List>): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['lists'], 'readwrite');
    const store = tx.objectStore('lists');

    const fullList: List = {
      id: list.id || randomUUID(),
      name: list.name || '',
      color: list.color || '#3b82f6',
      emoji: list.emoji || '📋',
      sortOrder: list.sortOrder || 0,
      createdAt: list.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDirty: true,
      isDeleted: false,
    };

    await store.put(fullList);
  }

  // Sync Queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'attempts' | 'createdAt'>): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['sync_queue'], 'readwrite');
    const store = tx.objectStore('sync_queue');

    const queueItem: SyncQueueItem = {
      id: randomUUID(),
      attempts: 0,
      createdAt: Date.now(),
      ...item,
    };

    await store.add(queueItem);
    this.syncQueue.push(queueItem);
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) return [];

    const tx = this.db.transaction(['sync_queue'], 'readonly');
    const store = tx.objectStore('sync_queue');
    const index = store.index('createdAt');

    return await store.getAll();
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['sync_queue'], 'readwrite');
    const store = tx.objectStore('sync_queue');
    await store.delete(id);

    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  async incrementSyncAttempts(id: string): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['sync_queue'], 'readwrite');
    const store = tx.objectStore('sync_queue');
    const item = await store.get(id);
    if (item) {
      await store.put({ ...item, attempts: item.attempts + 1 });
    }
  }

  // Settings
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['settings'], 'readwrite');
    const store = tx.objectStore('settings');

    await store.put({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) return null;

    const tx = this.db.transaction(['settings'], 'readonly');
    const store = tx.objectStore('settings');
    const item = await store.get(key);
    return item?.value || null;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['tasks', 'lists', 'labels', 'subtasks', 'comments', 'sync_queue'], 'readwrite');
    await Promise.all([
      tx.objectStore('tasks').clear(),
      tx.objectStore('lists').clear(),
      tx.objectStore('labels').clear(),
      tx.objectStore('subtasks').clear(),
      tx.objectStore('comments').clear(),
      tx.objectStore('sync_queue').clear(),
    ]);
  }
}

// Singleton instance
let cache: OfflineCache | null = null;

export function getOfflineCache(): OfflineCache {
  if (!cache) {
    cache = new OfflineCache();
  }
  return cache;
}

export async function initOfflineCache(): Promise<void> {
  cache = new OfflineCache();
  await cache.init();
}
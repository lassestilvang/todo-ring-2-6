/**
 * Sync Manager for TaskPlanner
 * Handles background synchronization between local cache and server
 */

import { getOfflineCache } from './offline-cache';
import { getDb } from '@/db/operations';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start periodic sync
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(() => this.sync(), intervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending changes to server
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;

    try {
      const cache = getOfflineCache();
      const pendingItems = await cache.getPendingSyncItems();

      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const item of pendingItems) {
        try {
          const success = await this.syncItem(item);
          if (success) {
            await cache.removeFromSyncQueue(item.id);
            synced++;
          } else {
            await this.handleSyncFailure(item, errors);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${item.entityType}:${item.entityId} - ${message}`);
          await this.handleSyncFailure(item, errors);
        }
      }

      return { success: true, synced, failed, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: any): Promise<boolean> {
    const response = await fetch(`/api/${item.entityType}s`, {
      method: this.getMethod(item.operation),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('taskplanner-token')}`,
      },
      body: item.operation === 'delete' ? undefined : JSON.stringify({
        id: item.entityId,
        ...item.data,
      }),
    });

    return response.ok;
  }

  private getMethod(operation: string): string {
    switch (operation) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  private async handleSyncFailure(item: any, errors: string[]): Promise<void> {
    const cache = getOfflineCache();
    item.attempts += 1;

    if (item.attempts >= 3) {
      errors.push(`${item.entityType}:${item.entityId} - Max retries exceeded`);
      // Keep item in queue for manual retry
    } else {
      await cache.addToSyncQueue({
        ...item,
        attempts: item.attempts,
      });
    }
  }

  /**
   * Fetch remote changes and merge with local cache
   */
  async fetchRemoteChanges(since?: string): Promise<void> {
    const response = await fetch(`/api/tasks?since=${since || ''}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('taskplanner-token')}`,
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    if (!data.success) return;

    const cache = getOfflineCache();
    const db = getDb();

    for (const task of data.data) {
      // Check if local version is newer
      const localTask = await cache.getTask(task.id);
      if (localTask && localTask.updatedAt > task.updated_at) {
        continue; // Keep local version
      }

      // Update local cache
      await cache.saveTask(task);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{ pending: number; isOnline: boolean; lastSync?: string }> {
    const cache = getOfflineCache();
    const pendingItems = await cache.getPendingSyncItems();
    const lastSync = localStorage.getItem('taskplanner-last-sync');

    return {
      pending: pendingItems.length,
      isOnline: navigator.onLine,
      lastSync: lastSync || undefined,
    };
  }

  /**
   * Mark last sync time
   */
  async markSyncComplete(): Promise<void> {
    localStorage.setItem('taskplanner-last-sync', new Date().toISOString());
  }
}

// Singleton instance
let syncManager: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (!syncManager) {
    syncManager = new SyncManager();
  }
  return syncManager;
}

export async function initSyncManager(): Promise<void> {
  const manager = getSyncManager();

  // Set up online/offline listeners
  window.addEventListener('online', () => {
    manager.sync();
  });

  // Start auto-sync when online
  if (navigator.onLine) {
    manager.startAutoSync();
  }
}
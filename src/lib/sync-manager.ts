/**
 * Sync Manager for TaskPlanner
 * Handles background synchronization between local cache and server
 */

import { getOfflineCache } from './offline-cache';
import { getDb } from '@/db/operations';
import { TaskSyncConflictResolver } from './server-cache';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictResolver = new TaskSyncConflictResolver();

  /**
   * Sync with conflict resolution
   */
  async syncWithConflictResolution(): Promise<SyncResult> {
    const result = await this.sync();

    // After sync, resolve any remaining conflicts
    if (result.failed > 0 && result.errors.length > 0) {
      return this.resolveConflicts(result);
    }

    return result;
  }

  /**
   * Resolve conflicts after failed sync attempts
   */
  private async resolveConflicts(result: SyncResult): Promise<SyncResult> {
    const cache = getOfflineCache();

    // Get conflicted items
    const conflictedItems = result.errors.map(e => {
      const match = e.match(/^(.+):(.+)$/);
      return match ? { entityType: match[1], entityId: match[2] } : null;
    }).filter(Boolean);

    for (const item of conflictedItems) {
      if (item) {
        // Get latest server version
        const serverVersion = await this.fetchServerVersion(item.entityId);
        const localVersion = await cache.getLocalVersion(item.entityId);

        // Last-write-wins strategy
        if (serverVersion && localVersion < serverVersion) {
          // Server is newer, discard local changes
          await cache.discardChanges(item.entityId);
          result.synced++;
          result.failed--;
        } else if (serverVersion && localVersion > serverVersion) {
          // Local is newer, retry sync
          await this.retrySync(item.entityId);
          result.synced++;
          result.failed--;
        }
      }
    }

    // Remove duplicate errors
    result.errors = result.errors.filter((_, i) => i >= result.errors.length - result.failed);
    return result;
  }

  private async fetchServerVersion(entityId: string): Promise<number | null> {
    try {
      const response = await fetch(`/api/tasks/${entityId}/version`);
      const data = await response.json();
      return data.success ? data.data.version : null;
    } catch {
      return null;
    }
  }

  private async retrySync(entityId: string): Promise<void> {
    // Implementation would requeue the entity for sync
    console.log(`Retrying sync for entity ${entityId}`);
  }

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
          // Acquire lock for conflict resolution
          const lockAcquired = await this.conflictResolver.acquireLock(item.entityId, item.userId || 'unknown');
          if (!lockAcquired) {
            errors.push(`${item.entityType}:${item.entityId} - Could not acquire lock`);
            failed++;
            continue;
          }

          const success = await this.syncItem(item);
          if (success) {
            await cache.removeFromSyncQueue(item.id);
            synced++;
          } else {
            await this.handleSyncFailure(item, errors);
          }

          // Release lock
          await this.conflictResolver.releaseLock(item.entityId, item.userId || 'unknown');
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
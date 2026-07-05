import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { Task, List } from '../types';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingChanges: number;
  sync: () => Promise<void>;
  addPendingChange: (entity: 'task' | 'list', action: 'create' | 'update' | 'delete', data: unknown) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const PENDING_CHANGES_KEY = 'pending_changes';

interface PendingChange {
  id: string;
  entity: 'task' | 'list';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    loadPendingChanges();
    loadLastSync();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOnline && pendingChanges > 0) {
      sync();
    }
  }, [isOnline]);

  const loadPendingChanges = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
      if (stored) {
        const changes: PendingChange[] = JSON.parse(stored);
        setPendingChanges(changes.length);
      }
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  };

  const loadLastSync = async (): Promise<void> => {
    try {
      const syncTime = await AsyncStorage.getItem('last_sync');
      setLastSync(syncTime);
    } catch (error) {
      console.error('Failed to load last sync:', error);
    }
  };

  const savePendingChanges = async (changes: PendingChange[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
      setPendingChanges(changes.length);
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  };

  const addPendingChange = useCallback(
    (entity: 'task' | 'list', action: 'create' | 'update' | 'delete', data: unknown) => {
      const changes: PendingChange[] = {
        id: `${Date.now()}-${Math.random()}`,
        entity,
        action,
        data,
        timestamp: Date.now(),
      };

      // In a real implementation, we'd load existing changes, append, and save
      setPendingChanges(prev => prev + 1);
    },
    []
  );

  const sync = async (): Promise<void> => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // Load pending changes
      const stored = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
      if (!stored) {
        setIsSyncing(false);
        return;
      }

      const changes: PendingChange[] = JSON.parse(stored);
      const processedChanges: PendingChange[] = [];

      // Process each change
      for (const change of changes) {
        try {
          const endpoint = change.entity === 'task' ? '/api/v1/tasks' : '/api/v1/lists';

          if (change.action === 'create') {
            await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(change.data),
            });
          } else if (change.action === 'update') {
            await fetch(endpoint, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(change.data),
            });
          } else if (change.action === 'delete') {
            await fetch(`${endpoint}?id=${change.data.id}`, { method: 'DELETE' });
          }

          processedChanges.push(change);
        } catch (error) {
          console.error(`Failed to sync change:`, error);
        }
      }

      // Remove processed changes
      const remaining = changes.filter(c => !processedChanges.find(pc => pc.id === c.id));
      await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(remaining));
      setPendingChanges(remaining.length);

      // Update last sync time
      const now = new Date().toISOString();
      await AsyncStorage.setItem('last_sync', now);
      setLastSync(now);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{
      isOnline,
      isSyncing,
      lastSync,
      pendingChanges,
      sync,
      addPendingChange,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}
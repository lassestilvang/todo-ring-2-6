'use client';

import { useEffect, useCallback } from 'react';
import { getDbCache } from '@/lib/db-cache';
import type { Task, List, Label } from '@/types/index';

/**
 * Hook for managing offline cache with React Query
 * Provides automatic caching and sync capabilities
 */
export function useOfflineCache() {
  const cache = getDbCache();

  // Cache tasks when they're fetched
  const cacheTasks = useCallback(async (tasks: Task[]) => {
    try {
      await cache.setTasks(tasks);
    } catch (error) {
      console.warn('Failed to cache tasks:', error);
    }
  }, [cache]);

  // Cache lists when they're fetched
  const cacheLists = useCallback(async (lists: List[]) => {
    try {
      await cache.setLists(lists);
    } catch (error) {
      console.warn('Failed to cache lists:', error);
    }
  }, [cache]);

  // Cache labels when they're fetched
  const cacheLabels = useCallback(async (labels: Label[]) => {
    try {
      await cache.setLabels(labels);
    } catch (error) {
      console.warn('Failed to cache labels:', error);
    }
  }, [cache]);

  // Get cached data
  const getCachedTasks = useCallback(async (): Promise<Task[] | null> => {
    try {
      return await cache.getTasks();
    } catch (error) {
      console.warn('Failed to get cached tasks:', error);
      return null;
    }
  }, [cache]);

  const getCachedLists = useCallback(async (): Promise<List[] | null> => {
    try {
      return await cache.getLists();
    } catch (error) {
      console.warn('Failed to get cached lists:', error);
      return null;
    }
  }, [cache]);

  const getCachedLabels = useCallback(async (): Promise<Label[] | null> => {
    try {
      return await cache.getLabels();
    } catch (error) {
      console.warn('Failed to get cached labels:', error);
      return null;
    }
  }, [cache]);

  // Check if online
  const isOnline = useCallback(() => {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await cache.clear();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, [cache]);

  return {
    cacheTasks,
    cacheLists,
    cacheLabels,
    getCachedTasks,
    getCachedLists,
    getCachedLabels,
    isOnline,
    clearCache,
  };
}

/**
 * Prefetch data for offline use
 */
export async function prefetchForOffline() {
  try {
    const cache = getDbCache();

    // Fetch and cache tasks
    const tasksRes = await fetch('/api/tasks?view=all');
    if (tasksRes.ok) {
      const tasksJson = await tasksRes.json();
      if (tasksJson.success) {
        await cache.setTasks(tasksJson.data);
      }
    }

    // Fetch and cache lists
    const listsRes = await fetch('/api/lists');
    if (listsRes.ok) {
      const listsJson = await listsRes.json();
      if (listsJson.success) {
        await cache.setLists(listsJson.data);
      }
    }

    // Fetch and cache labels
    const labelsRes = await fetch('/api/labels');
    if (labelsRes.ok) {
      const labelsJson = await labelsRes.json();
      if (labelsJson.success) {
        await cache.setLabels(labelsJson.data);
      }
    }
  } catch (error) {
    console.warn('Failed to prefetch data for offline:', error);
  }
}
/**
 * Performance Utilities
 * Memoization helpers, debounce, and other performance utilities
 */

import { useMemo, useCallback } from 'react';

/**
 * Debounced callback hook
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return {
      get: () => timeoutId,
      set: (id: ReturnType<typeof setTimeout>) => {
        timeoutId = id;
      },
      clear: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      timeoutRef.clear();
      timeoutRef.set(setTimeout(() => callback(...args), delay) as any);
    }) as T,
    [callback, delay]
  );
}

/**
 * Create a stable callback for filtering
 */
export function useStableCallback<T>(
  callback: (item: T) => boolean,
  deps: any[]
): (item: T) => boolean {
  return useCallback(callback, deps);
}

/**
 * Memoize a filtered list
 */
export function useFilteredList<T>(
  items: T[],
  filter: (item: T) => boolean
): T[] {
  return useMemo(() => items.filter(filter), [items, filter]);
}

/**
 * Memoize a sorted list
 */
export function useSortedList<T>(
  items: T[],
  sortFn: (a: T, b: T) => number
): T[] {
  return useMemo(() => [...items].sort(sortFn), [items, sortFn]);
}

/**
 * Batch state updates
 */
export function useBatchUpdate<T>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useMemo(() => ({
    state: initialState,
    updates: {} as Partial<T>,
  }), []);

  const applyUpdates = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state.state, applyUpdates];
}

/**
 * Virtual list item renderer helper
 */
export function getItemSize(index: number, baseSize: number, variation = 0): number {
  return baseSize + variation;
}

/**
 * Calculate item key for virtual lists
 */
export function getItemKey(item: any, index: number): string {
  return item.id || `item-${index}`;
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  } as T;
}
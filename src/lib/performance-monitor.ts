/**
 * Performance Monitoring Module
 * Tracks and reports application performance metrics
 */

interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
  type: 'api' | 'db' | 'render' | 'custom';
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private entries: PerformanceEntry[] = [];
  private maxEntries: number = 10000;
  private enabled: boolean;

  constructor(options?: { enabled?: boolean; maxEntries?: number }) {
    this.enabled = options?.enabled ?? process.env.NODE_ENV === 'development';
    this.maxEntries = options?.maxEntries ?? 10000;
  }

  /**
   * Start timing an operation
   */
  start(name: string, type: PerformanceEntry['type'] = 'custom'): () => void {
    if (!this.enabled) return () => {};

    const start = performance.now();
    const id = `${name}-${start}`;

    return () => {
      const duration = performance.now() - start;
      this.record({
        name,
        duration,
        timestamp: Date.now(),
        type,
      });
    };
  }

  /**
   * Record a performance entry
   */
  record(entry: PerformanceEntry): void {
    if (!this.enabled) return;

    this.entries.push(entry);

    // Trim entries if exceeding max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  /**
   * Get stats for a specific operation
   */
  getStats(name: string): PerformanceStats | null {
    const filtered = this.entries.filter(e => e.name === name);
    if (filtered.length === 0) return null;

    const durations = filtered.map(e => e.duration).sort((a, b) => a - b);

    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
    };
  }

  /**
   * Get all stats grouped by operation name
   */
  getAllStats(): Record<string, PerformanceStats> {
    const names = new Set(this.entries.map(e => e.name));
    const result: Record<string, PerformanceStats> = {};

    for (const name of names) {
      const stats = this.getStats(name);
      if (stats) {
        result[name] = stats;
      }
    }

    return result;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Export entries for analysis
   */
  export(): PerformanceEntry[] {
    return [...this.entries];
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
      return sorted[index];
    }
    return sorted[Math.floor(index)] +
           (sorted[Math.ceil(index)] - sorted[Math.floor(index)]) *
           (index - Math.floor(index));
  }
}

// Singleton instance
let monitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(options?: { enabled?: boolean; maxEntries?: number }): PerformanceMonitor {
  if (!monitor) {
    monitor = new PerformanceMonitor(options);
  }
  return monitor;
}

export async function withTiming<T>(name: string, fn: () => Promise<T>, type: 'api' | 'db' | 'render' = 'custom'): Promise<T> {
  const perf = getPerformanceMonitor();
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    perf.record({ name, duration, timestamp: Date.now(), type });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    perf.record({ name, duration, timestamp: Date.now(), type, metadata: { error: (error as Error).message } });
    throw error;
  }
}

export type { PerformanceEntry, PerformanceStats };
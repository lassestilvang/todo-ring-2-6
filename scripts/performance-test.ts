import { performance } from 'perf_hooks';

interface PerformanceMetric {
  duration: number;
  memoryUsed: number;
  timestamp: number;
}

class PerformanceTester {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const result = await fn();

    const end = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    this.metrics.get(operation)?.push({
      duration: end - start,
      memoryUsed: endMemory - startMemory,
      timestamp: Date.now()
    });

    return result;
  }

  getReport(): Record<string, { avgDuration: number; avgMemory: number; count: number }> {
    const report: Record<string, any> = {};

    for (const [operation, metrics] of this.metrics) {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsed, 0) / metrics.length;
      report[operation] = {
        avgDuration,
        avgMemory,
        count: metrics.length
      };
    }

    return report;
  }
}

export const perf = new PerformanceTester();
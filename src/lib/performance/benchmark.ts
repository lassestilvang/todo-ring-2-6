/**
 * Performance Benchmarking Utilities
 * Provides tools for measuring and comparing performance
 */

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
}

export class Benchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark for a given operation
   */
  async run<T>(
    name: string,
    operation: () => Promise<T> | T,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Warm up
    for (let i = 0; i < 5; i++) {
      await operation();
    }

    // Run iterations
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      opsPerSec: (iterations / totalTime) * 1000,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Run multiple benchmarks
   */
  async runSuite(suite: { name: string; operation: () => Promise<any> | any }[]): Promise<BenchmarkResult[]> {
    const results = [];
    for (const { name, operation } of suite) {
      results.push(await this.run(name, operation));
    }
    return results;
  }

  /**
   * Get results as JSON
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Generate a report
   */
  generateReport(): string {
    const lines = ['Performance Benchmark Results', '='.repeat(40), ''];

    for (const result of this.results) {
      lines.push(`${result.name}:`);
      lines.push(`  Iterations: ${result.iterations}`);
      lines.push(`  Total Time: ${result.totalTime.toFixed(2)}ms`);
      lines.push(`  Avg Time: ${result.avgTime.toFixed(4)}ms`);
      lines.push(`  Min Time: ${result.minTime.toFixed(4)}ms`);
      lines.push(`  Max Time: ${result.maxTime.toFixed(4)}ms`);
      lines.push(`  Ops/sec: ${result.opsPerSec.toFixed(2)}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Database query benchmark
 */
export async function benchmarkQuery(
  name: string,
  query: () => any,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const benchmark = new Benchmark();
  return benchmark.run(name, query, iterations);
}

/**
 * API endpoint benchmark
 */
export async function benchmarkEndpoint(
  name: string,
  url: string,
  options: RequestInit = {},
  iterations: number = 100
): Promise<BenchmarkResult> {
  const benchmark = new Benchmark();
  return benchmark.run(
    name,
    () => fetch(url, options),
    iterations
  );
}

/**
 * Memory usage benchmark
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }
  return { used: 0, total: 0, percentage: 0 };
}

/**
 * CPU usage monitoring for Node.js environments
 */
export function getCpuUsage(): {
  user: number;
  system: number;
  percentage: number;
} {
  if (typeof process !== 'undefined' && process.cpuUsage) {
    const usage = process.cpuUsage();
    const totalMs = (usage.user + usage.system) / 1000;
    return {
      user: usage.user / 1000,
      system: usage.system / 1000,
      percentage: (totalMs / 10000) * 100, // Percentage of 100ms period
    };
  }
  return { user: 0, system: 0, percentage: 0 };
}

/**
 * Monitor resource usage and log warnings
 */
export function monitorResources(): {
  memory: ReturnType<typeof getMemoryUsage>;
  cpu: ReturnType<typeof getCpuUsage>;
  timestamp: number;
} {
  const memory = getMemoryUsage();
  const cpu = getCpuUsage();

  // Log warning if resources are high
  if (memory.percentage > 80) {
    console.warn(`High memory usage: ${memory.percentage.toFixed(1)}%`);
  }
  if (cpu.percentage > 80) {
    console.warn(`High CPU usage: ${cpu.percentage.toFixed(1)}%`);
  }

  return { memory, cpu, timestamp: Date.now() };
}

/**
 * Performance dashboard data collector
 */
export function collectDashboardMetrics(): any {
  return {
    memory: getMemoryUsage(),
    cpu: getCpuUsage(),
    cacheStats: {
      size: typeof cache !== 'undefined' ? (cache as any).size : 0,
      keys: typeof globalCacheRegistry !== 'undefined' ? (globalCacheRegistry as any).size : 0,
    },
    timestamp: Date.now(),
  };
}

/**
 * Performance marks for detailed timing
 */
export class PerformanceMarks {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(start: string, end: string): number {
    const startTime = this.marks.get(start);
    const endTime = this.marks.get(end);
    if (startTime && endTime) {
      return endTime - startTime;
    }
    return 0;
  }

  clear(): void {
    this.marks.clear();
  }
}
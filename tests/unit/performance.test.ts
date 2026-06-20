import { describe, it, expect, beforeEach } from 'vitest';

// Performance benchmarks for critical operations
interface Store {
  tasks: any[];
  lists: any[];
  subtasks: any[];
  labels: any[];
}

const store: Store = {
  tasks: [],
  lists: [],
  subtasks: [],
  labels: [],
};

const resetStore = () => {
  store.tasks = [];
  store.lists = [];
  store.subtasks = [];
  store.labels = [];
};

const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

function createTask(data: { title: string; description?: string; priority?: string; status?: string }) {
  const id = generateId();
  const task = {
    id,
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'none',
    status: data.status || 'pending',
    sort_order: store.tasks.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

function createList(data: { name: string; color: string; emoji: string }) {
  const id = generateId();
  const list = { id, ...data, is_inbox: 0, sort_order: store.lists.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  store.lists.push(list);
  return list;
}

function searchTasks(query: string) {
  const pattern = query.toLowerCase();
  return store.tasks.filter(t =>
    t.title.toLowerCase().includes(pattern) || t.description.toLowerCase().includes(pattern)
  );
}

function getTaskStats() {
  return {
    total: store.tasks.length,
    completed: store.tasks.filter(t => t.status === 'completed').length,
    pending: store.tasks.filter(t => t.status === 'pending').length,
    inProgress: store.tasks.filter(t => t.status === 'in_progress').length,
  };
}

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  createTask: 5, // 5ms per task creation
  searchTasks: 100, // 100ms for 1000 tasks search
  getStats: 10, // 10ms for stats calculation
  createList: 5, // 5ms per list creation
};

describe('Performance Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Task Creation Performance', () => {
    it('should create 100 tasks in under 500ms', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        createTask({ title: `Task ${i}` });
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });

    it('should create tasks with acceptable individual latency', () => {
      const createTaskSync = (data: { title: string }) => {
        const start = performance.now();
        createTask(data);
        return performance.now() - start;
      };

      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        times.push(createTaskSync({ title: `Task ${i}` }));
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.createTask);
    });
  });

  describe('Search Performance', () => {
    it('should search 1000 tasks in under 100ms', () => {
      // Create 1000 tasks
      for (let i = 0; i < 1000; i++) {
        createTask({ title: `Task number ${i}`, description: `Description ${i}` });
      }

      const start = performance.now();
      const results = searchTasks('Task');
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLDS.searchTasks);
      expect(results.length).toBe(1000);
    });

    it('should handle empty search query efficiently', () => {
      for (let i = 0; i < 100; i++) {
        createTask({ title: `Task ${i}` });
      }

      const start = performance.now();
      const results = searchTasks('');
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(results.length).toBe(100);
    });
  });

  describe('Stats Calculation Performance', () => {
    it('should calculate stats for 1000 tasks in under 50ms', () => {
      for (let i = 0; i < 1000; i++) {
        createTask({ title: `Task ${i}`, status: i % 3 === 0 ? 'completed' : 'pending' });
      }

      const start = performance.now();
      const stats = getTaskStats();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(stats.total).toBe(1000);
    });
  });

  describe('List Creation Performance', () => {
    it('should create 100 lists in under 100ms', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        createList({ name: `List ${i}`, color: '#3b82f6', emoji: '📋' });
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large datasets without memory issues', () => {
      // Create a large number of tasks
      for (let i = 0; i < 5000; i++) {
        createTask({ title: `Task ${i}` });
      }

      expect(store.tasks.length).toBe(5000);

      // Search should still work
      const results = searchTasks('Task');
      expect(results.length).toBe(5000);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple operations efficiently', () => {
      const start = performance.now();

      // Simulate concurrent operations
      for (let i = 0; i < 100; i++) {
        createTask({ title: `Task ${i}` });
        createList({ name: `List ${i}`, color: '#aaa', emoji: '📋' });
      }

      const stats = getTaskStats();
      const elapsed = performance.now() - start;

      expect(stats.total).toBe(100);
      expect(store.lists.length).toBe(100);
      expect(elapsed).toBeLessThan(200);
    });
  });
});
/**
 * Performance & Load Testing Suite
 * Validates system performance under various load conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
}

describe('Performance Testing Suite', () => {
  let metrics: PerformanceMetrics;

  beforeAll(async () => {
    // Warm up server
    await fetch('http://localhost:3000/api/health');
  });

  describe('API Response Time Tests', () => {
    it('should respond to task creation within 200ms', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Performance Test', priority: 'high' })
      });
      const duration = Date.now() - start;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(200);
    });

    it('should respond to task retrieval within 100ms', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/tasks');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should respond to AI analysis within 500ms', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/ai-task-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText: 'Test task for AI analysis' })
      });
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Load Testing', () => {
    it('should handle 100 concurrent task creations', async () => {
      const concurrentRequests = Array(100).fill(null).map((_, i) =>
        fetch('http://localhost:3000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Load Test Task ${i}`, priority: 'medium' })
        })
      );

      const responses = await Promise.all(concurrentRequests);
      const successRate = responses.filter(r => r.status === 201).length / responses.length;

      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
    });

    it('should maintain response times under sustained load', async () => {
      const results: number[] = [];

      for (let i = 0; i < 500; i++) {
        const start = Date.now();
        await fetch('http://localhost:3000/api/tasks');
        results.push(Date.now() - start);
      }

      const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxResponseTime = Math.max(...results);

      expect(avgResponseTime).toBeLessThan(150);
      expect(maxResponseTime).toBeLessThan(1000);
    });

    it('should handle spike traffic gracefully', async () => {
      // Simulate traffic spike
      const spikeRequests = Array(200).fill(null).map(() =>
        fetch('http://localhost:3000/api/tasks')
      );

      const responses = await Promise.all(spikeRequests);
      const successRate = responses.filter(r => r.ok).length / responses.length;
      const errorRate = responses.filter(r => r.status === 500).length / responses.length;

      expect(successRate).toBeGreaterThan(0.98);
      expect(errorRate).toBeLessThan(0.02); // Less than 2% errors
    });
  });

  describe('Memory & Resource Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        await fetch('http://localhost:3000/api/tasks');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory should not increase by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Performance', () => {
    it('should handle complex queries efficiently', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/tasks?filter=all&include=subtasks,labels,dependencies');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(300);
    });
  });
});
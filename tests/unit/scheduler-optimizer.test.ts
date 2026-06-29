import { describe, it, expect, beforeEach } from 'vitest';
import { ScheduleOptimizer } from '@/lib/scheduler/schedule-optimizer';
import type { Task } from '@/types/index';

describe('ScheduleOptimizer', () => {
  let optimizer: ScheduleOptimizer;

  beforeEach(() => {
    optimizer = new ScheduleOptimizer();
  });

  it('should optimize schedule for basic tasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        estimateHours: 2,
      },
      {
        id: '2',
        title: 'Task 2',
        status: 'pending',
        priority: 'medium',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        estimateHours: 1,
      },
    ];

    const result = optimizer.optimize(tasks);

    expect(result.slots.length).toBe(2);
    expect(result.slots[0].taskId).toBe('1');
    expect(result.efficiencyScore).toBeGreaterThan(0);
  });

  it('should handle empty task list', () => {
    const result = optimizer.optimize([]);
    expect(result.slots.length).toBe(0);
    expect(result.efficiencyScore).toBe(0);
  });

  it('should calculate correct energy levels', () => {
    const highEnergySlot = optimizer.optimize([]).slots[0];
    expect(['high', 'medium', 'low']).toContain(highEnergySlot?.energyLevel);
  });

  it('should sort tasks by priority', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Low priority',
        status: 'pending',
        priority: 'low',
        userId: 'user1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'High priority',
        status: 'pending',
        priority: 'high',
        userId: 'user1',
        createdAt: new Date().toISOString(),
      },
    ];

    const result = optimizer.optimize(tasks);
    expect(result.slots[0].taskId).toBe('2'); // High priority first
  });
});

describe('ScheduleOptimizer - suggestOptimalTimeslots', () => {
  let optimizer: ScheduleOptimizer;

  beforeEach(() => {
    optimizer = new ScheduleOptimizer();
  });

  it('should return time slot suggestions', () => {
    const suggestions = optimizer.suggestOptimalTimeslots(new Date(), 2);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('should return valid Date objects', () => {
    const suggestions = optimizer.suggestOptimalTimeslots(new Date(), 1);
    suggestions.forEach(suggestion => {
      expect(suggestion).toBeInstanceOf(Date);
    });
  });
});
import { bench, describe } from 'vitest';
import { generateReminderEmail, generateReminderText } from '../../src/lib/email';
import type { Task } from '../../src/types';

// Mock task for benchmarking
const mockTask: Task = {
  id: 'task-1',
  title: 'Performance Test Task with a Long Title to Measure Rendering Speed',
  description: 'This is a comprehensive description for performance testing purposes. It contains multiple sentences and various details about the task that needs to be completed efficiently.',
  listId: 'list-1',
  date: null,
  deadline: '2024-12-31',
  priority: 'high',
  status: 'pending',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

describe('Notification Performance Benchmarks', () => {
  bench('generate HTML email', () => {
    generateReminderEmail(mockTask);
  });

  bench('generate plain text email', () => {
    generateReminderText(mockTask);
  });
});
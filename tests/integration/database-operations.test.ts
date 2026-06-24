/**
 * Database Operations Integration Tests
 *
 * These tests use a real SQLite in-memory database.
 * Run with: npm run test:integration
 *
 * Prerequisites: native bindings for better-sqlite3 must be available.
 * If you see "Could not locate the bindings file" errors, run:
 *   npm install better-sqlite3 --build-from-source
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupIntegrationTests, closeIntegrationDb, clearAllTables } from './setup';
import {
  createList,
  getListById,
  getAllLists,
  updateList,
  deleteList,
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
  createUser,
  getUserById,
  getUserByEmail,
  createGoal,
  getGoalById,
  updateGoalProgress,
  calculateNextDate,
} from '../../db/operations';

// Check if database is available
let dbAvailable = false;

beforeAll(() => {
  const db = setupIntegrationTests();
  dbAvailable = db !== null;
});

afterAll(() => {
  closeIntegrationDb();
});

// Skip all tests in this file if database isn't available
const describeSkip = dbAvailable ? describe : describe.skip;

describeSkip('Database Operations - Integration Tests', () => {
  beforeEach(() => {
    clearAllTables();
  });

  describe('List Operations', () => {
    it('should create and retrieve a list', () => {
      const list = createList({ name: 'Test List', color: '#ff0000', emoji: '📋' });
      expect(list.name).toBe('Test List');
      expect(list.id).toBeDefined();

      const found = getListById(list.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test List');
    });

    it('should get all lists', () => {
      createList({ name: 'List 1', color: '#1', emoji: '📋' });
      createList({ name: 'List 2', color: '#2', emoji: '📋' });

      const lists = getAllLists();
      expect(lists.length).toBe(2);
    });

    it('should update a list', () => {
      const list = createList({ name: 'Old Name', color: '#1', emoji: '📋' });
      const updated = updateList(list.id, { name: 'New Name' });
      expect(updated.name).toBe('New Name');
    });

    it('should delete a list', () => {
      const list = createList({ name: 'To Delete', color: '#1', emoji: '📋' });
      deleteList(list.id);

      const found = getListById(list.id);
      expect(found).toBeUndefined();
    });
  });

  describe('Task Operations', () => {
    it('should create and retrieve a task', () => {
      const task = createTask({ title: 'Test Task' });
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('none');
    });

    it('should get tasks by list', () => {
      const list = createList({ name: 'List', color: '#1', emoji: '📋' });
      createTask({ title: 'Task 1', listId: list.id });
      createTask({ title: 'Task 2', listId: list.id });

      const tasks = getTasks(list.id);
      expect(tasks.length).toBe(2);
    });

    it('should update a task', () => {
      const task = createTask({ title: 'Old Title' });
      const updated = updateTask(task.id, { title: 'New Title', status: 'completed' });
      expect(updated.title).toBe('New Title');
      expect(updated.status).toBe('completed');
    });

    it('should delete a task', () => {
      const task = createTask({ title: 'To Delete' });
      deleteTask(task.id);

      const found = getTaskById(task.id);
      expect(found).toBeUndefined();
    });

    it('should throw for non-existent task update', () => {
      expect(() => updateTask('non-existent', { title: 'Updated' })).toThrow('Task not found');
    });
  });

  describe('User Operations', () => {
    it('should create and retrieve a user', () => {
      const user = createUser({ name: 'Test User', email: 'test@example.com' });
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });

    it('should get user by ID', () => {
      const user = createUser({ name: 'Test', email: 't@t.com' });
      const found = getUserById(user.id);
      expect(found?.name).toBe('Test');
    });

    it('should get user by email', () => {
      createUser({ name: 'Test', email: 'test@example.com' });
      const found = getUserByEmail('test@example.com');
      expect(found?.name).toBe('Test');
    });
  });

  describe('Goal Operations', () => {
    it('should create and retrieve a goal', () => {
      const goal = createGoal({
        userId: 'user-1',
        title: 'Test Goal',
        targetValue: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(goal.title).toBe('Test Goal');
      expect(goal.currentValue).toBe(0);
    });

    it('should update goal progress', () => {
      const goal = createGoal({
        userId: 'user-1',
        title: 'Test',
        targetValue: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      const updated = updateGoalProgress(goal.id, 50);
      expect(updated.currentValue).toBe(50);
    });
  });

  describe('Recurrence Logic', () => {
    it('should calculate daily recurrence', () => {
      const result = calculateNextDate('2024-01-15', 'daily', '1');
      expect(result).toBe('2024-01-16');
    });

    it('should calculate weekly recurrence', () => {
      const result = calculateNextDate('2024-01-15', 'weekly', '1');
      expect(result).toBe('2024-01-22');
    });

    it('should calculate monthly recurrence', () => {
      const result = calculateNextDate('2024-01-15', 'monthly', '1');
      expect(result).toBe('2024-02-15');
    });

    it('should return null for invalid type', () => {
      const result = calculateNextDate('2024-01-15', 'invalid');
      expect(result).toBeNull();
    });
  });
});
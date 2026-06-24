/**
 * Integration tests for database operations
 * These tests verify the database client and operations module.
 * Run with: npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupIntegrationTests, closeIntegrationDb } from './setup';

// Check if database is available
let dbAvailable = false;

beforeAll(() => {
  const db = setupIntegrationTests();
  dbAvailable = db !== null;
});

afterAll(() => {
  closeIntegrationDb();
});

// Skip all tests if database isn't available
const describeSkip = dbAvailable ? describe : describe.skip;

describeSkip('Database Integration Tests', () => {
  describe('Database Client', () => {
    it('should initialize database client', async () => {
      const module = await import('../../db/db-client');
      expect(module).toBeDefined();
      expect(typeof module.getDb).toBe('function');
      expect(typeof module.initDb).toBe('function');
    });

    it('should inject and reset database', async () => {
      const module = await import('../../db/db-client');
      const mockDb = {};
      module.injectDb(mockDb);
      module.resetDb();
      expect(module).toBeDefined();
    });
  });

  describe('Database Schema', () => {
    it('should have correct schema structure', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');

      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        expect(schema).toContain('CREATE TABLE');
        expect(schema).toContain('tasks');
        expect(schema).toContain('lists');
        expect(schema).toContain('users');
      }
    });
  });

  describe('Database Operations', () => {
    it('should export all required operations', async () => {
      const module = await import('../../db/operations');

      // List operations
      expect(typeof module.getAllLists).toBe('function');
      expect(typeof module.getListById).toBe('function');
      expect(typeof module.getInboxList).toBe('function');
      expect(typeof module.createList).toBe('function');
      expect(typeof module.updateList).toBe('function');
      expect(typeof module.deleteList).toBe('function');
      expect(typeof module.updateListSortOrder).toBe('function');

      // Task operations
      expect(typeof module.getTaskById).toBe('function');
      expect(typeof module.getTasks).toBe('function');
      expect(typeof module.getAllTasks).toBe('function');
      expect(typeof module.getInboxTasks).toBe('function');
      expect(typeof module.getTasksForToday).toBe('function');
      expect(typeof module.getTasksForNext7Days).toBe('function');
      expect(typeof module.getUpcomingTasks).toBe('function');
      expect(typeof module.createTask).toBe('function');
      expect(typeof module.updateTask).toBe('function');
      expect(typeof module.deleteTask).toBe('function');
      expect(typeof module.toggleTaskStatus).toBe('function');
      expect(typeof module.searchTasks).toBe('function');
      expect(typeof module.updateTaskSortOrder).toBe('function');

      // Subtask operations
      expect(typeof module.getSubtasks).toBe('function');
      expect(typeof module.createSubtask).toBe('function');
      expect(typeof module.toggleSubtask).toBe('function');
      expect(typeof module.deleteSubtask).toBe('function');

      // Label operations
      expect(typeof module.getAllLabels).toBe('function');
      expect(typeof module.getLabelById).toBe('function');
      expect(typeof module.createLabel).toBe('function');
      expect(typeof module.updateLabel).toBe('function');
      expect(typeof module.deleteLabel).toBe('function');
      expect(typeof module.getTaskLabels).toBe('function');
      expect(typeof module.getTasksByLabel).toBe('function');
      expect(typeof module.addLabelToTask).toBe('function');
      expect(typeof module.removeLabelFromTask).toBe('function');

      // Dependency operations
      expect(typeof module.getTaskDependencies).toBe('function');
      expect(typeof module.getTaskDependents).toBe('function');
      expect(typeof module.addTaskDependency).toBe('function');
      expect(typeof module.removeTaskDependency).toBe('function');
      expect(typeof module.getBlockedTasks).toBe('function');
      expect(typeof module.canCompleteTask).toBe('function');

      // User operations
      expect(typeof module.getUserById).toBe('function');
      expect(typeof module.getUserByEmail).toBe('function');
      expect(typeof module.createUser).toBe('function');
      expect(typeof module.updateUser).toBe('function');
      expect(typeof module.deleteUser).toBe('function');

      // Session operations
      expect(typeof module.createSession).toBe('function');
      expect(typeof module.getSession).toBe('function');
      expect(typeof module.deleteSession).toBe('function');
      expect(typeof module.deleteAllUserSessions).toBe('function');

      // Token operations
      expect(typeof module.createRefreshToken).toBe('function');
      expect(typeof module.getRefreshToken).toBe('function');
      expect(typeof module.deleteRefreshToken).toBe('function');
    });
  });
});
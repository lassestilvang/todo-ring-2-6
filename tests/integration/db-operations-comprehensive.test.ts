/**
 * Comprehensive Integration Tests for Database Operations
 *
 * Tests all major database operations with a real SQLite in-memory database.
 * Run with: npm run test:integration
 *
 * Prerequisites: native bindings for better-sqlite3 must be available.
 * If you see "Could not locate the bindings file" errors, run:
 *   npm install better-sqlite3 --build-from-source
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupIntegrationTests, closeIntegrationDb, clearAllTables } from './setup';
import {
  // List operations
  createList,
  getListById,
  getAllLists,
  updateList,
  deleteList,
  getInboxList,
  updateListSortOrder,
  // Task operations
  createTask,
  getTaskById,
  getTasks,
  getAllTasks,
  getInboxTasks,
  getTasksForToday,
  getTasksForNext7Days,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  searchTasks,
  updateTaskSortOrder,
  // Subtask operations
  createSubtask,
  getSubtasks,
  toggleSubtask,
  deleteSubtask,
  // Label operations
  createLabel,
  getAllLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
  getTaskLabels,
  // User operations
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  // Session operations
  createSession,
  getSession,
  deleteSession,
  // Refresh token operations
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  // Goal operations
  createGoal,
  getGoalById,
  updateGoalProgress,
  // Template operations
  createTemplate,
  getTemplates,
  rateTemplate,
  // Dependency operations
  addTaskDependency,
  getTaskDependencies,
  getBlockedTasks,
  canCompleteTask,
  // Comment operations
  addTaskComment,
  getTaskComments,
  deleteTaskComment,
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

describeSkip('Comprehensive Database Operations', () => {
  beforeEach(() => {
    clearAllTables();
  });

  describe('List Operations', () => {
    it('should create a list with default values', () => {
      const list = createList({ name: 'My List', color: '#3b82f6', emoji: '📋' });
      expect(list.name).toBe('My List');
      expect(list.color).toBe('#3b82f6');
      expect(list.emoji).toBe('📋');
      expect(list.sortOrder).toBeDefined();
      expect(list.createdAt).toBeDefined();
      expect(list.updatedAt).toBeDefined();
    });

    it('should get inbox list or create it if not exists', () => {
      const inbox = getInboxList();
      expect(inbox.name).toBe('Inbox');
      expect(inbox.isInbox).toBe(1);
    });

    it('should update list sort order', () => {
      const list1 = createList({ name: 'List 1', color: '#1', emoji: '📋' });
      const list2 = createList({ name: 'List 2', color: '#2', emoji: '📋' });

      const updated = updateListSortOrder(list1.id, 1);
      expect(updated.sortOrder).toBe(1);
    });

    it('should return all lists ordered by sort_order', () => {
      createList({ name: 'A', color: '#1', emoji: '📋' });
      createList({ name: 'B', color: '#2', emoji: '📋' });

      const lists = getAllLists();
      expect(lists.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Task Operations', () => {
    it('should create a task with all fields', () => {
      const list = createList({ name: 'Test List', color: '#1', emoji: '📋' });
      const task = createTask({
        title: 'Complete feature',
        description: 'Implement the new feature',
        listId: list.id,
        date: '2024-06-15',
        deadline: '2024-06-20',
        estimateHours: 2,
        estimateMinutes: 30,
        priority: 'high',
      });

      expect(task.title).toBe('Complete feature');
      expect(task.description).toBe('Implement the new feature');
      expect(task.listId).toBe(list.id);
      expect(task.priority).toBe('high');
      expect(task.status).toBe('pending');
    });

    it('should create task in inbox when no list specified', () => {
      const task = createTask({ title: 'Inbox Task' });
      const inbox = getInboxList();
      expect(task.listId).toBe(inbox.id);
    });

    it('should get tasks for today', () => {
      const today = new Date().toISOString().split('T')[0];
      createTask({ title: 'Today Task', date: today });

      const tasks = getTasksForToday();
      expect(tasks.some(t => t.title === 'Today Task')).toBe(true);
    });

    it('should get tasks for next 7 days', () => {
      const tasks = getTasksForNext7Days();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('should toggle task status', () => {
      const task = createTask({ title: 'Toggle Test' });
      expect(task.status).toBe('pending');

      const completed = toggleTaskStatus(task.id);
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();

      const reopened = toggleTaskStatus(task.id);
      expect(reopened.status).toBe('pending');
      expect(reopened.completedAt).toBeNull();
    });

    it('should search tasks', () => {
      createTask({ title: 'Unique Search Term Task' });
      createTask({ title: 'Other Task' });

      const results = searchTasks('Unique Search Term');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Unique Search Term Task');
    });

    it('should update task sort order', () => {
      const task1 = createTask({ title: 'Task 1' });
      const task2 = createTask({ title: 'Task 2' });

      const updated = updateTaskSortOrder(task1.id, 1);
      expect(updated.sortOrder).toBe(1);
    });
  });

  describe('Subtask Operations', () => {
    it('should create subtasks', () => {
      const task = createTask({ title: 'Parent' });
      const subtask = createSubtask({ title: 'Child', taskId: task.id });
      expect(subtask.title).toBe('Child');
      expect(subtask.taskId).toBe(task.id);
    });

    it('should get subtasks for a task', () => {
      const task = createTask({ title: 'Parent' });
      createSubtask({ title: 'Child 1', taskId: task.id });
      createSubtask({ title: 'Child 2', taskId: task.id });

      const subtasks = getSubtasks(task.id);
      expect(subtasks.length).toBe(2);
    });

    it('should toggle subtask completion', () => {
      const task = createTask({ title: 'Parent' });
      const subtask = createSubtask({ title: 'Child', taskId: task.id });

      const toggled = toggleSubtask(subtask.id);
      expect(toggled.isCompleted).toBe(1);
    });
  });

  describe('Label Operations', () => {
    it('should create a label', () => {
      const label = createLabel({ name: 'Important', color: '#ff0000', icon: '⭐' });
      expect(label.name).toBe('Important');
      expect(label.color).toBe('#ff0000');
    });

    it('should add label to task', () => {
      const task = createTask({ title: 'Task' });
      const label = createLabel({ name: 'Urgent', color: '#ff0000' });

      addLabelToTask(task.id, label.id);
      const taskLabels = getTaskLabels(task.id);
      expect(taskLabels.length).toBe(1);
      expect(taskLabels[0].name).toBe('Urgent');
    });

    it('should remove label from task', () => {
      const task = createTask({ title: 'Task' });
      const label = createLabel({ name: 'Label', color: '#1' });

      addLabelToTask(task.id, label.id);
      removeLabelFromTask(task.id, label.id);

      const taskLabels = getTaskLabels(task.id);
      expect(taskLabels.length).toBe(0);
    });
  });

  describe('Dependency Operations', () => {
    it('should add task dependency', () => {
      const parent = createTask({ title: 'Parent Task' });
      const child = createTask({ title: 'Child Task' });

      const dep = addTaskDependency(child.id, parent.id);
      expect(dep.taskId).toBe(child.id);
      expect(dep.dependsOnId).toBe(parent.id);
    });

    it('should get task dependencies', () => {
      const parent = createTask({ title: 'Parent' });
      const child = createTask({ title: 'Child' });

      addTaskDependency(child.id, parent.id);

      const deps = getTaskDependencies(child.id);
      expect(deps.length).toBe(1);
      expect(deps[0].dependsOnId).toBe(parent.id);
    });

    it('should get blocked tasks', () => {
      const parent = createTask({ title: 'Parent', status: 'pending' });
      const child = createTask({ title: 'Child', status: 'pending' });

      addTaskDependency(child.id, parent.id);

      const blocked = getBlockedTasks();
      expect(blocked.length).toBe(1);
      expect(blocked[0].id).toBe(child.id);
    });

    it('should check if task can be completed', () => {
      const parent = createTask({ title: 'Parent' });
      const child = createTask({ title: 'Child' });

      addTaskDependency(child.id, parent.id);

      expect(canCompleteTask(child.id)).toBe(false);
    });
  });

  describe('User Operations', () => {
    it('should create a user', () => {
      const user = createUser({ name: 'Test User', email: 'test@example.com' });
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });

    it('should update a user', () => {
      const user = createUser({ name: 'Jane', email: 'jane@example.com' });
      const updated = updateUser(user.id, { name: 'Jane Doe' });
      expect(updated.name).toBe('Jane Doe');
    });

    it('should delete a user', () => {
      const user = createUser({ name: 'To Delete', email: 'delete@example.com' });
      deleteUser(user.id);

      const deleted = getUserById(user.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Session Operations', () => {
    it('should create and get session', () => {
      const user = createUser({ name: 'Test', email: 'test@example.com' });
      const session = createSession({ userId: user.id });

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(user.id);
    });

    it('should get valid session', () => {
      const user = createUser({ name: 'Test', email: 'test2@example.com' });
      const session = createSession({ userId: user.id });

      const found = getSession(session.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(session.id);
    });

    it('should delete session', () => {
      const user = createUser({ name: 'Test', email: 'test3@example.com' });
      const session = createSession({ userId: user.id });

      deleteSession(session.id);

      const found = getSession(session.id);
      expect(found).toBeUndefined();
    });
  });

  describe('Refresh Token Operations', () => {
    it('should create and get refresh token', () => {
      const user = createUser({ name: 'Test', email: 'test4@example.com' });
      const token = createRefreshToken(user.id);

      expect(token.id).toBeDefined();
      expect(token.userId).toBe(user.id);
    });

    it('should get valid refresh token', () => {
      const user = createUser({ name: 'Test', email: 'test5@example.com' });
      const token = createRefreshToken(user.id);

      const found = getRefreshToken(token.token);
      expect(found).toBeDefined();
      expect(found?.userId).toBe(user.id);
    });

    it('should delete refresh token', () => {
      const user = createUser({ name: 'Test', email: 'test6@example.com' });
      const token = createRefreshToken(user.id);

      deleteRefreshToken(token.id);

      const found = getRefreshToken(token.token);
      expect(found).toBeUndefined();
    });
  });

  describe('Template Operations', () => {
    it('should create a template', () => {
      const template = createTemplate({
        name: 'Weekly Report',
        title: 'Weekly Status Report',
        description: 'Template for weekly reports',
        category: 'work',
      });

      expect(template.name).toBe('Weekly Report');
      expect(template.title).toBe('Weekly Status Report');
    });

    it('should get templates by category', () => {
      createTemplate({ name: 'Template 1', title: 'T1', category: 'personal' });
      createTemplate({ name: 'Template 2', title: 'T2', category: 'personal' });

      const templates = getTemplates('personal');
      expect(templates.length).toBeGreaterThanOrEqual(2);
    });

    it('should rate a template', () => {
      const template = createTemplate({ name: 'Rate Me', title: 'RM' });
      const rating = rateTemplate(template.id, 5);

      expect(rating.rating).toBe(5);
    });
  });

  describe('Comment Operations', () => {
    it('should add a comment to a task', () => {
      const task = createTask({ title: 'Task' });
      const comment = addTaskComment({
        taskId: task.id,
        userId: 'user-1',
        userName: 'Commenter',
        content: 'This is a comment',
      });

      expect(comment.content).toBe('This is a comment');
    });

    it('should get comments for a task', () => {
      const task = createTask({ title: 'Task' });
      addTaskComment({ taskId: task.id, userId: 'u1', userName: 'User', content: 'Comment 1' });
      addTaskComment({ taskId: task.id, userId: 'u2', userName: 'User', content: 'Comment 2' });

      const comments = getTaskComments(task.id);
      expect(comments.length).toBe(2);
    });

    it('should delete a comment', () => {
      const task = createTask({ title: 'Task' });
      const comment = addTaskComment({
        taskId: task.id,
        userId: 'u1',
        userName: 'User',
        content: 'To delete',
      });

      deleteTaskComment(comment.id);

      const comments = getTaskComments(task.id);
      expect(comments.length).toBe(0);
    });
  });
});
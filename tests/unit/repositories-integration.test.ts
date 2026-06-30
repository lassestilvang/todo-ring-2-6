/**
 * Repository Integration Tests
 *
 * Tests repository classes with actual database operations.
 * Requires native SQLite bindings - run with `npm run test:integration`
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { getDb, injectDb, resetDb } from '../../db/db-client';

// Import all repositories
import { TaskRepository, getTaskRepository } from '../../src/lib/repositories/task-repository';
import { ListRepository, getListRepository } from '../../src/lib/repositories/list-repository';
import { LabelRepository, getLabelRepository } from '../../src/lib/repositories/label-repository';
import { UserRepository, getUserRepository } from '../../src/lib/repositories/user-repository';
import { GoalRepository, getGoalRepository } from '../../src/lib/repositories/goal-repository';
import { ThemeRepository, getThemeRepository } from '../../src/lib/repositories/theme-repository';
import { TemplateRepository, getTemplateRepository } from '../../src/lib/repositories/template-repository';

describe('Repository Integration Tests', () => {
  let db: Database.Database;

  beforeAll(async () => {
    // Create in-memory database for testing
    db = new Database(':memory:');
    await injectDb(db);

    // Initialize schema
    const schema = await import('../../db/schema.sql');
    db.exec(schema.default);
  });

  afterAll(() => {
    db.close();
  });

  describe('TaskRepository', () => {
    let taskRepo: TaskRepository;
    let listRepo: ListRepository;

    beforeAll(() => {
      taskRepo = getTaskRepository();
      listRepo = getListRepository();
    });

    it('should create a task', async () => {
      const list = await listRepo.create({ name: 'Test List' });
      const task = await taskRepo.create({
        title: 'Test Task',
        listId: list.id,
        priority: 'high',
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('pending');
    });

    it('should find task by ID', async () => {
      const list = await listRepo.create({ name: 'Test List 2' });
      const created = await taskRepo.create({
        title: 'Find Me',
        listId: list.id,
      });

      const found = await taskRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Find Me');
    });

    it('should update task status', async () => {
      const list = await listRepo.create({ name: 'Test List 3' });
      const task = await taskRepo.create({ title: 'Status Test', listId: list.id });

      const updated = await taskRepo.toggleStatus(task.id, 'completed');
      expect(updated.status).toBe('completed');
    });

    it('should delete a task', async () => {
      const list = await listRepo.create({ name: 'Test List 4' });
      const task = await taskRepo.create({ title: 'To Delete', listId: list.id });

      await taskRepo.delete(task.id);
      const found = await taskRepo.findById(task.id);
      expect(found).toBeNull();
    });
  });

  describe('ListRepository', () => {
    let listRepo: ListRepository;

    beforeAll(() => {
      listRepo = getListRepository();
    });

    it('should create a list', async () => {
      const list = await listRepo.create({
        name: 'My List',
        color: '#ff0000',
        emoji: '📋',
      });

      expect(list).toBeDefined();
      expect(list.name).toBe('My List');
      expect(list.color).toBe('#ff0000');
    });

    it('should find inbox list', async () => {
      const inbox = await listRepo.findInbox();
      expect(inbox).toBeDefined();
      expect(inbox.isInbox).toBe(1);
    });

    it('should update list', async () => {
      const list = await listRepo.create({ name: 'Original Name' });
      const updated = await listRepo.update(list.id, { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
    });
  });

  describe('LabelRepository', () => {
    let labelRepo: LabelRepository;

    beforeAll(() => {
      labelRepo = getLabelRepository();
    });

    it('should create a label', async () => {
      const label = await labelRepo.create({
        name: 'Important',
        color: '#3b82f6',
        icon: '⭐',
      });

      expect(label).toBeDefined();
      expect(label.name).toBe('Important');
    });

    it('should find label by name', async () => {
      await labelRepo.create({ name: 'UniqueLabel', color: '#000000' });
      const found = await labelRepo.findByName('UniqueLabel');
      expect(found).toBeDefined();
      expect(found?.name).toBe('UniqueLabel');
    });

    it('should add label to task', async () => {
      const taskRepo = getTaskRepository();
      const listRepo = getListRepository();
      const list = await listRepo.create({ name: 'Label Test List' });
      const task = await taskRepo.create({ title: 'Task with Label', listId: list.id });
      const label = await labelRepo.create({ name: 'Tagged', color: '#ff0000' });

      await labelRepo.addLabelToTask(task.id, label.id);
      const taskLabels = await labelRepo.getTasksByLabel(label.id);
      expect(taskLabels).toContain(task.id);
    });
  });

  describe('UserRepository', () => {
    let userRepo: UserRepository;

    beforeAll(() => {
      userRepo = getUserRepository();
    });

    it('should create a user', async () => {
      const user = await userRepo.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should find user by email', async () => {
      await userRepo.create({
        name: 'Email Test',
        email: 'emailtest@example.com',
        password: 'hashed',
      });

      const found = await userRepo.findByEmail('emailtest@example.com');
      expect(found).toBeDefined();
      expect(found?.email).toBe('emailtest@example.com');
    });
  });

  describe('GoalRepository', () => {
    let goalRepo: GoalRepository;
    let userRepo: UserRepository;

    beforeAll(() => {
      goalRepo = getGoalRepository();
      userRepo = getUserRepository();
    });

    it('should create a goal', async () => {
      const user = await userRepo.create({
        name: 'Goal User',
        email: 'goal@example.com',
        password: 'hashed',
      });

      const goal = await goalRepo.create({
        userId: user.id,
        title: 'Complete Project',
        targetValue: 100,
        unit: 'tasks',
        period: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(goal).toBeDefined();
      expect(goal.title).toBe('Complete Project');
      expect(goal.targetValue).toBe(100);
    });

    it('should update goal progress', async () => {
      const user = await userRepo.create({
        name: 'Progress User',
        email: 'progress@example.com',
        password: 'hashed',
      });

      const goal = await goalRepo.create({
        userId: user.id,
        title: 'Learning Goal',
        targetValue: 50,
        unit: 'lessons',
        period: 'weekly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await goalRepo.updateProgress(goal.id, 25);
      const updated = await goalRepo.findById(goal.id);
      expect(updated?.currentValue).toBe(25);
    });
  });

  describe('ThemeRepository', () => {
    let themeRepo: ThemeRepository;

    beforeAll(() => {
      themeRepo = getThemeRepository();
    });

    it('should create a custom theme', async () => {
      const theme = await themeRepo.create({
        name: 'Ocean Blue',
        colors: JSON.stringify({ primary: '#3b82f6', secondary: '#1d4ed8' }),
        emoji: '🌊',
        isCustom: 1,
      });

      expect(theme).toBeDefined();
      expect(theme.name).toBe('Ocean Blue');
    });
  });

  describe('TemplateRepository', () => {
    let templateRepo: TemplateRepository;

    beforeAll(() => {
      templateRepo = getTemplateRepository();
    });

    it('should create a template', async () => {
      const template = await templateRepo.create({
        name: 'Meeting Template',
        title: 'Team Meeting',
        description: 'Weekly team sync',
        priority: 'medium',
      });

      expect(template).toBeDefined();
      expect(template.title).toBe('Team Meeting');
    });
  });
});
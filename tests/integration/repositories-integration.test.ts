/**
 * Integration tests for new repositories
 * These tests require native SQLite bindings
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, initializeDb } from '../../db/db-client';
import { getAutomationRuleRepository } from '../../src/lib/repositories/automation-rule-repository';
import { getFocusSessionRepository } from '../../src/lib/repositories/focus-session-repository';
import { getTimeEntryRepository } from '../../src/lib/repositories/time-entry-repository';

describe('Repositories Integration Tests', () => {
  beforeAll(async () => {
    await initializeDb();
  });

  describe('AutomationRuleRepository', () => {
    it('should create an automation rule', async () => {
      const repo = getAutomationRuleRepository();
      const rule = repo.create({
        name: 'Test Rule',
        triggerType: 'task_completed',
        actionType: 'send_notification',
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.isEnabled).toBe(true);
    });

    it('should find automation rule by ID', async () => {
      const repo = getAutomationRuleRepository();
      const created = repo.create({
        name: 'Find Test',
        triggerType: 'task_created',
        actionType: 'create_task',
      });

      const found = repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should update automation rule', async () => {
      const repo = getAutomationRuleRepository();
      const created = repo.create({
        name: 'Update Test',
        triggerType: 'task_updated',
        actionType: 'set_priority',
      });

      const updated = repo.update(created.id, { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
    });

    it('should delete automation rule', async () => {
      const repo = getAutomationRuleRepository();
      const created = repo.create({
        name: 'Delete Test',
        triggerType: 'priority_changed',
        actionType: 'add_label',
      });

      repo.delete(created.id);
      const found = repo.findById(created.id);
      expect(found).toBeUndefined();
    });
  });

  describe('FocusSessionRepository', () => {
    it('should create a focus session', async () => {
      const repo = getFocusSessionRepository();
      const session = repo.create({
        userId: 'test-user-id',
        duration: 25,
        startedAt: new Date().toISOString(),
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.duration).toBe(25);
      expect(session.status).toBe('active');
    });

    it('should find focus sessions by user', async () => {
      const repo = getFocusSessionRepository();
      const userId = 'test-user-sessions';

      repo.create({ userId, duration: 25, startedAt: new Date().toISOString() });
      repo.create({ userId, duration: 30, startedAt: new Date().toISOString() });

      const sessions = repo.findAll(userId);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('TimeEntryRepository', () => {
    it('should create a time entry', async () => {
      const repo = getTimeEntryRepository();
      const entry = repo.create({
        taskId: 'test-task-id',
        startTime: new Date().toISOString(),
        duration: 60,
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.duration).toBe(60);
    });

    it('should find time entries by task', async () => {
      const repo = getTimeEntryRepository();
      const taskId = 'test-task-entries';

      repo.create({ taskId, startTime: new Date().toISOString(), duration: 30 });
      repo.create({ taskId, startTime: new Date().toISOString(), duration: 45 });

      const entries = repo.findByTask(taskId);
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });
  });
});
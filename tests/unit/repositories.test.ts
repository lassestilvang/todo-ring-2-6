/**
 * Repository Tests
 *
 * Tests for all repository classes and their methods.
 * These tests verify the repository pattern implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';

// Mock the db-client module
vi.mock('../../db/db-client', () => ({
  getDb: () => ({
    prepare: vi.fn().mockReturnThis(),
    all: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue(null),
    run: vi.fn().mockReturnValue({ lastInsertRowid: 'test-id' }),
    exec: vi.fn(),
    transaction: vi.fn((fn) => fn()),
  }),
  injectDb: vi.fn(),
  resetDb: vi.fn(),
}));

// Repository exports test
describe('Repository Pattern - Exports', () => {
  it('should export all repository functions from index', async () => {
    const repositories = await import('../../src/lib/repositories');

    // Task repository
    expect(repositories.getTaskRepository).toBeDefined();

    // List repository
    expect(repositories.getListRepository).toBeDefined();

    // Label repository
    expect(repositories.getLabelRepository).toBeDefined();

    // User repository
    expect(repositories.getUserRepository).toBeDefined();

    // Subtask repository
    expect(repositories.getSubtaskRepository).toBeDefined();

    // Comment repository
    expect(repositories.getCommentRepository).toBeDefined();

    // Team repository
    expect(repositories.getTeamRepository).toBeDefined();

    // Time entry repository
    expect(repositories.getTimeEntryRepository).toBeDefined();

    // Theme repository
    expect(repositories.getThemeRepository).toBeDefined();

    // Goal repository
    expect(repositories.getGoalRepository).toBeDefined();

    // Template repository
    expect(repositories.getTemplateRepository).toBeDefined();

    // Custom field repository
    expect(repositories.getCustomFieldRepository).toBeDefined();

    // Notification settings repository
    expect(repositories.getNotificationSettingsRepository).toBeDefined();

    // Audit log repository
    expect(repositories.getAuditLogRepository).toBeDefined();

    // Push subscription repository
    expect(repositories.getPushSubscriptionRepository).toBeDefined();

    // Session repository
    expect(repositories.getSessionRepository).toBeDefined();

    // Refresh token repository
    expect(repositories.getRefreshTokenRepository).toBeDefined();

    // Password reset token repository
    expect(repositories.getPasswordResetTokenRepository).toBeDefined();

    // MFA secret repository
    expect(repositories.getMfaSecretRepository).toBeDefined();

    // Task history repository
    expect(repositories.getTaskHistoryRepository).toBeDefined();

    // Reminder repository
    expect(repositories.getReminderRepository).toBeDefined();

    // Task dependency repository
    expect(repositories.getTaskDependencyRepository).toBeDefined();

    // Task share repository
    expect(repositories.getTaskShareRepository).toBeDefined();

    // List share repository
    expect(repositories.getListShareRepository).toBeDefined();

    // Comment mention repository
    expect(repositories.getCommentMentionRepository).toBeDefined();

    // Habit streak repository
    expect(repositories.getHabitStreakRepository).toBeDefined();

    // Recurring exception repository
    expect(repositories.getRecurringExceptionRepository).toBeDefined();
  });
});

describe('Repository Pattern - Class Exports', () => {
  it('should export all repository classes', async () => {
    const repositories = await import('../../src/lib/repositories');

    // Verify classes exist
    expect(repositories.TaskRepository).toBeDefined();
    expect(repositories.ListRepository).toBeDefined();
    expect(repositories.LabelRepository).toBeDefined();
    expect(repositories.UserRepository).toBeDefined();
    expect(repositories.SubtaskRepository).toBeDefined();
    expect(repositories.CommentRepository).toBeDefined();
    expect(repositories.TeamRepository).toBeDefined();
    expect(repositories.TimeEntryRepository).toBeDefined();
    expect(repositories.ThemeRepository).toBeDefined();
    expect(repositories.GoalRepository).toBeDefined();
    expect(repositories.TemplateRepository).toBeDefined();
    expect(repositories.CustomFieldRepository).toBeDefined();
    expect(repositories.NotificationSettingsRepository).toBeDefined();
    expect(repositories.AuditLogRepository).toBeDefined();
    expect(repositories.PushSubscriptionRepository).toBeDefined();
    expect(repositories.SessionRepository).toBeDefined();
    expect(repositories.RefreshTokenRepository).toBeDefined();
    expect(repositories.PasswordResetTokenRepository).toBeDefined();
    expect(repositories.MfaSecretRepository).toBeDefined();
    expect(repositories.TaskHistoryRepository).toBeDefined();
    expect(repositories.ReminderRepository).toBeDefined();
    expect(repositories.TaskDependencyRepository).toBeDefined();
    expect(repositories.TaskShareRepository).toBeDefined();
    expect(repositories.ListShareRepository).toBeDefined();
    expect(repositories.CommentMentionRepository).toBeDefined();
    expect(repositories.HabitStreakRepository).toBeDefined();
    expect(repositories.RecurringExceptionRepository).toBeDefined();
  });
});

describe('Repository Pattern - Instance Creation', () => {
  it('should create TaskRepository instance', async () => {
    const { TaskRepository, getTaskRepository } = await import('../../src/lib/repositories/task-repository');
    const repo = getTaskRepository();
    expect(repo).toBeInstanceOf(TaskRepository);
  });

  it('should create ListRepository instance', async () => {
    const { ListRepository, getListRepository } = await import('../../src/lib/repositories/list-repository');
    const repo = getListRepository();
    expect(repo).toBeInstanceOf(ListRepository);
  });

  it('should create LabelRepository instance', async () => {
    const { LabelRepository, getLabelRepository } = await import('../../src/lib/repositories/label-repository');
    const repo = getLabelRepository();
    expect(repo).toBeInstanceOf(LabelRepository);
  });

  it('should create UserRepository instance', async () => {
    const { UserRepository, getUserRepository } = await import('../../src/lib/repositories/user-repository');
    const repo = getUserRepository();
    expect(repo).toBeInstanceOf(UserRepository);
  });

  it('should create SubtaskRepository instance', async () => {
    const { SubtaskRepository, getSubtaskRepository } = await import('../../src/lib/repositories/subtask-repository');
    const repo = getSubtaskRepository();
    expect(repo).toBeInstanceOf(SubtaskRepository);
  });

  it('should create CommentRepository instance', async () => {
    const { CommentRepository, getCommentRepository } = await import('../../src/lib/repositories/comment-repository');
    const repo = getCommentRepository();
    expect(repo).toBeInstanceOf(CommentRepository);
  });

  it('should create GoalRepository instance', async () => {
    const { GoalRepository, getGoalRepository } = await import('../../src/lib/repositories/goal-repository');
    const repo = getGoalRepository();
    expect(repo).toBeInstanceOf(GoalRepository);
  });

  it('should create ThemeRepository instance', async () => {
    const { ThemeRepository, getThemeRepository } = await import('../../src/lib/repositories/theme-repository');
    const repo = getThemeRepository();
    expect(repo).toBeInstanceOf(ThemeRepository);
  });

  it('should create TemplateRepository instance', async () => {
    const { TemplateRepository, getTemplateRepository } = await import('../../src/lib/repositories/template-repository');
    const repo = getTemplateRepository();
    expect(repo).toBeInstanceOf(TemplateRepository);
  });

  it('should create TimeEntryRepository instance', async () => {
    const { TimeEntryRepository, getTimeEntryRepository } = await import('../../src/lib/repositories/time-entry-repository');
    const repo = getTimeEntryRepository();
    expect(repo).toBeInstanceOf(TimeEntryRepository);
  });

  it('should create TeamRepository instance', async () => {
    const { TeamRepository, getTeamRepository } = await import('../../src/lib/repositories/team-repository');
    const repo = getTeamRepository();
    expect(repo).toBeInstanceOf(TeamRepository);
  });

  it('should create CustomFieldRepository instance', async () => {
    const { CustomFieldRepository, getCustomFieldRepository } = await import('../../src/lib/repositories/custom-field-repository');
    const repo = getCustomFieldRepository();
    expect(repo).toBeInstanceOf(CustomFieldRepository);
  });

  it('should create TaskHistoryRepository instance', async () => {
    const { TaskHistoryRepository, getTaskHistoryRepository } = await import('../../src/lib/repositories/task-history-repository');
    const repo = getTaskHistoryRepository();
    expect(repo).toBeInstanceOf(TaskHistoryRepository);
  });

  it('should create TaskShareRepository instance', async () => {
    const { TaskShareRepository, getTaskShareRepository } = await import('../../src/lib/repositories/task-share-repository');
    const repo = getTaskShareRepository();
    expect(repo).toBeInstanceOf(TaskShareRepository);
  });

  it('should create ListShareRepository instance', async () => {
    const { ListShareRepository, getListShareRepository } = await import('../../src/lib/repositories/list-share-repository');
    const repo = getListShareRepository();
    expect(repo).toBeInstanceOf(ListShareRepository);
  });

  it('should create TaskDependencyRepository instance', async () => {
    const { TaskDependencyRepository, getTaskDependencyRepository } = await import('../../src/lib/repositories/task-dependency-repository');
    const repo = getTaskDependencyRepository();
    expect(repo).toBeInstanceOf(TaskDependencyRepository);
  });

  it('should create ReminderRepository instance', async () => {
    const { ReminderRepository, getReminderRepository } = await import('../../src/lib/repositories/reminder-repository');
    const repo = getReminderRepository();
    expect(repo).toBeInstanceOf(ReminderRepository);
  });

  it('should create SessionRepository instance', async () => {
    const { SessionRepository, getSessionRepository } = await import('../../src/lib/repositories/session-repository');
    const repo = getSessionRepository();
    expect(repo).toBeInstanceOf(SessionRepository);
  });

  it('should create RefreshTokenRepository instance', async () => {
    const { RefreshTokenRepository, getRefreshTokenRepository } = await import('../../src/lib/repositories/refresh-token-repository');
    const repo = getRefreshTokenRepository();
    expect(repo).toBeInstanceOf(RefreshTokenRepository);
  });

  it('should create PasswordResetTokenRepository instance', async () => {
    const { PasswordResetTokenRepository, getPasswordResetTokenRepository } = await import('../../src/lib/repositories/password-reset-token-repository');
    const repo = getPasswordResetTokenRepository();
    expect(repo).toBeInstanceOf(PasswordResetTokenRepository);
  });

  it('should create MfaSecretRepository instance', async () => {
    const { MfaSecretRepository, getMfaSecretRepository } = await import('../../src/lib/repositories/mfa-secret-repository');
    const repo = getMfaSecretRepository();
    expect(repo).toBeInstanceOf(MfaSecretRepository);
  });

  it('should create HabitStreakRepository instance', async () => {
    const { HabitStreakRepository, getHabitStreakRepository } = await import('../../src/lib/repositories/habit-streak-repository');
    const repo = getHabitStreakRepository();
    expect(repo).toBeInstanceOf(HabitStreakRepository);
  });

  it('should create PushSubscriptionRepository instance', async () => {
    const { PushSubscriptionRepository, getPushSubscriptionRepository } = await import('../../src/lib/repositories/push-subscription-repository');
    const repo = getPushSubscriptionRepository();
    expect(repo).toBeInstanceOf(PushSubscriptionRepository);
  });

  it('should create NotificationSettingsRepository instance', async () => {
    const { NotificationSettingsRepository, getNotificationSettingsRepository } = await import('../../src/lib/repositories/notification-settings-repository');
    const repo = getNotificationSettingsRepository();
    expect(repo).toBeInstanceOf(NotificationSettingsRepository);
  });

  it('should create AuditLogRepository instance', async () => {
    const { AuditLogRepository, getAuditLogRepository } = await import('../../src/lib/repositories/audit-log-repository');
    const repo = getAuditLogRepository();
    expect(repo).toBeInstanceOf(AuditLogRepository);
  });

  it('should create CommentMentionRepository instance', async () => {
    const { CommentMentionRepository, getCommentMentionRepository } = await import('../../src/lib/repositories/comment-mention-repository');
    const repo = getCommentMentionRepository();
    expect(repo).toBeInstanceOf(CommentMentionRepository);
  });

  it('should create RecurringExceptionRepository instance', async () => {
    const { RecurringExceptionRepository, getRecurringExceptionRepository } = await import('../../src/lib/repositories/recurring-exception-repository');
    const repo = getRecurringExceptionRepository();
    expect(repo).toBeInstanceOf(RecurringExceptionRepository);
  });
});

describe('Repository Pattern - Singleton Behavior', () => {
  it('should return same instance for TaskRepository', async () => {
    const { getTaskRepository } = await import('../../src/lib/repositories/task-repository');
    const repo1 = getTaskRepository();
    const repo2 = getTaskRepository();
    expect(repo1).toBe(repo2);
  });

  it('should return same instance for ListRepository', async () => {
    const { getListRepository } = await import('../../src/lib/repositories/list-repository');
    const repo1 = getListRepository();
    const repo2 = getListRepository();
    expect(repo1).toBe(repo2);
  });

  it('should return same instance for UserRepository', async () => {
    const { getUserRepository } = await import('../../src/lib/repositories/user-repository');
    const repo1 = getUserRepository();
    const repo2 = getUserRepository();
    expect(repo1).toBe(repo2);
  });
});

describe('Repository Pattern - Method Signatures', () => {
  it('TaskRepository should have correct method signatures', async () => {
    const { TaskRepository } = await import('../../src/lib/repositories/task-repository');
    const repo = new TaskRepository();
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findByList).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect(typeof repo.updateSortOrder).toBe('function');
    expect(typeof repo.getTasksForToday).toBe('function');
    expect(typeof repo.getTasksForNext7Days).toBe('function');
    expect(typeof repo.getUpcomingTasks).toBe('function');
    expect(typeof repo.getByDate).toBe('function');
    expect(typeof repo.getAllTasks).toBe('function');
    expect(typeof repo.getInboxTasks).toBe('function');
    expect(typeof repo.search).toBe('function');
    expect(typeof repo.toggleStatus).toBe('function');
    expect(typeof repo.getPagination).toBe('function');
  });

  it('ListRepository should have correct method signatures', async () => {
    const { ListRepository } = await import('../../src/lib/repositories/list-repository');
    const repo = new ListRepository();
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findInbox).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect(typeof repo.updateSortOrder).toBe('function');
  });

  it('LabelRepository should have correct method signatures', async () => {
    const { LabelRepository } = await import('../../src/lib/repositories/label-repository');
    const repo = new LabelRepository();
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findByName).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect(typeof repo.getTasksByLabel).toBe('function');
    expect(typeof repo.removeLabelFromTask).toBe('function');
  });

  it('UserRepository should have correct method signatures', async () => {
    const { UserRepository } = await import('../../src/lib/repositories/user-repository');
    const repo = new UserRepository();
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.findByEmail).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
  });

  it('GoalRepository should have correct method signatures', async () => {
    const { GoalRepository } = await import('../../src/lib/repositories/goal-repository');
    const repo = new GoalRepository();
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findByPeriod).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.updateProgress).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect(typeof repo.getActiveByPeriod).toBe('function');
    expect(typeof repo.getProgress).toBe('function');
  });
});
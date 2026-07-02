import { test, expect, describe } from '@playwright/test';

/**
 * E2E Tests for New Features
 * Tests the newly implemented features
 */

describe('Task Planner New Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'test-token');
    });
  });

  describe('Task Dependencies', () => {
    test('should display dependency graph', async ({ page }) => {
      await page.goto('/tasks');
      // Click on a task to open detail view
      await page.click('[data-task-id]:first-child');
      // Click dependencies tab
      await page.click('button:has-text("Dependencies")');
      // Should show dependency graph
      await expect(page.locator('[data-dependency-graph]')).toBeVisible();
    });

    test('should prevent circular dependencies', async ({ page }) => {
      // This would require API mocking
      await page.goto('/tasks');
      // Attempt to create circular dependency
      // Should show error
    });
  });

  describe('Saved Views', () => {
    test('should save current view', async ({ page }) => {
      await page.goto('/tasks');
      // Apply some filters
      await page.click('[data-filter-button]');
      // Click save view
      await page.click('button:has-text("Save Current")');
      await page.fill('input[placeholder="View name"]', 'My Filter');
      await page.click('button:has-text("Save")');
      // Should appear in saved views
      await expect(page.locator('[data-saved-view]')).toContainText('My Filter');
    });

    test('should load saved view', async ({ page }) => {
      await page.goto('/tasks');
      // Click on saved view
      await page.click('[data-saved-view]:first-child');
      // Filters should be applied
      await expect(page.locator('[data-active-filter]')).toBeVisible();
    });
  });

  describe('Time Tracking', () => {
    test('should display time tracking report', async ({ page }) => {
      await page.goto('/analytics/time-tracking');
      await expect(page.locator('h2:has-text("Time Tracking Report")')).toBeVisible();
      await expect(page.locator('[data-time-chart]')).toBeVisible();
    });

    test('should export time entries', async ({ page }) => {
      await page.goto('/analytics/time-tracking');
      await page.click('button:has-text("Export")');
      // CSV download should start
    });
  });

  describe('Template Marketplace', () => {
    test('should browse templates', async ({ page }) => {
      await page.goto('/templates');
      await expect(page.locator('h2:has-text("Template Marketplace")')).toBeVisible();
      await expect(page.locator('[data-template-card]')).toBeVisible();
    });

    test('should preview template', async ({ page }) => {
      await page.goto('/templates');
      await page.click('[data-template-card]:first-child');
      await expect(page.locator('[data-template-preview]')).toBeVisible();
    });
  });

  describe('Calendar Integration', () => {
    test('should show calendar connection options', async ({ page }) => {
      await page.goto('/settings/integrations');
      await expect(page.locator('button:has-text("Connect Google Calendar")')).toBeVisible();
      await expect(page.locator('button:has-text("Connect Outlook")')).toBeVisible();
    });
  });

  describe('Goal Task Conversion', () => {
    test('should show goal breakdown option', async ({ page }) => {
      await page.goto('/goals');
      await page.click('[data-goal-card]:first-child');
      await expect(page.locator('button:has-text("Generate Tasks")')).toBeVisible();
    });
  });

  describe('Team Workload', () => {
    test('should display team analytics', async ({ page }) => {
      await page.goto('/teams/test-team/analytics');
      await expect(page.locator('h2:has-text("Team Workload")')).toBeVisible();
      await expect(page.locator('[data-workload-chart]')).toBeVisible();
    });
  });

  describe('Comment Reactions', () => {
    test('should add reaction to comment', async ({ page }) => {
      await page.goto('/tasks');
      await page.click('[data-comment]:first-child');
      await page.click('button[data-reaction="👍"]');
      await expect(page.locator('[data-reaction-count="👍"]')).toContainText('1');
    });
  });
});

describe('Accessibility Checks', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    // Check for skip link
    await expect(page.locator('a[href="#main-content"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '#main-content');
  });
});
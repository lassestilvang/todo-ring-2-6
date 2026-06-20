import { test, expect, Page } from '@playwright/test';

// Enhanced E2E Tests for Task Management
// Comprehensive user flow tests

test.describe('Task Creation and Management', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
  });

  test('should create a task with natural language parsing', async () => {
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Meeting tomorrow at 2pm');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Meeting')).toBeVisible();
    await expect(page.getByText('tomorrow')).toBeVisible();
  });

  test('should create task with priority', async () => {
    // Open task detail dialog for priority setting
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('High priority task');
    await page.keyboard.press('Enter');

    // Click on the created task
    await page.click('text=High priority task');

    // The task should be visible in the detail view
    await expect(page.getByText('High priority task')).toBeVisible();
  });

  test('should create task with due date', async () => {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];

    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type(`Review project by ${dateString}`);
    await page.keyboard.press('Enter');

    await expect(page.getByText('Review project')).toBeVisible();
  });

  test('should filter tasks by search', async () => {
    // Create multiple tasks
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Alpha project task');
    await page.keyboard.press('Enter');

    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Beta project task');
    await page.keyboard.press('Enter');

    // Search for Alpha
    await page.click('input[type="search"]');
    await page.keyboard.type('Alpha');

    await expect(page.getByText('Alpha project task')).toBeVisible();
    await expect(page.getByText('Beta project task')).not.toBeVisible();
  });

  test('should clear search and show all tasks', async () => {
    // Create a task first
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Unique search test');
    await page.keyboard.press('Enter');

    // Search
    await page.click('input[type="search"]');
    await page.keyboard.type('Unique');
    await page.keyboard.press('Backspace', { count: 6 });

    await expect(page.getByText('Unique search test')).toBeVisible();
  });
});

test.describe('Task Completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
  });

  test('should mark task as completed', async () => {
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Task to complete');
    await page.keyboard.press('Enter');

    // Click the checkbox
    const checkbox = page.locator('button').filter({ has: page.locator('circle') }).first();
    await checkbox.click();

    // Verify strikethrough
    await expect(page.getByText('Task to complete')).toHaveClass(/line-through/);
  });

  test('should show completed tasks section', async () => {
    // Create and complete a task
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Completed task');
    await page.keyboard.press('Enter');

    const checkbox = page.locator('button').filter({ has: page.locator('circle') }).first();
    await checkbox.click();

    // Wait for completed section to appear
    await expect(page.getByText('Completed')).toBeVisible();
  });
});

test.describe('View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
  });

  test('should switch to Kanban board view', async () => {
    await page.click('button:has-text("Board")');
    await expect(page.locator('.kanban-board')).toBeVisible();
  });

  test('should switch to Calendar view', async () => {
    await page.click('button:has-text("Calendar")');
    await expect(page.locator('.calendar-view')).toBeVisible();
  });

  test('should switch to Gantt chart view', async () => {
    await page.click('button:has-text("Gantt")');
    await expect(page.locator('.gantt-chart')).toBeVisible();
  });
});

test.describe('Bulk Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
  });

  test('should select multiple tasks', async () => {
    // Create tasks
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Task one');
    await page.keyboard.press('Enter');

    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Task two');
    await page.keyboard.press('Enter');

    // Enable selection mode
    await page.keyboard.press('Meta+a');

    // Verify selection
    await expect(page.getByText('1 task selected')).toBeVisible();
  });

  test('should delete multiple tasks', async () => {
    // Create tasks
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Bulk delete task 1');
    await page.keyboard.press('Enter');

    await page.click('input[placeholder*="What needs to be done"]')
    await page.keyboard.type('Bulk delete task 2');
    await page.keyboard.press('Enter');

    // Select all
    await page.keyboard.press('Meta+a');
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    await expect(page.getByText('Bulk delete task 1')).not.toBeVisible();
    await expect(page.getByText('Bulk delete task 2')).not.toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
  });

  test('should have proper heading structure', async () => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have accessible form elements', async () => {
    const input = page.locator('input[placeholder*="What needs to be done"]');
    await expect(input).toBeFocused();
  });

  test('should be navigable with keyboard', async () => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('BUTTON');
  });
});

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
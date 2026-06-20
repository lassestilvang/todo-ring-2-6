import { test, expect, Page } from '@playwright/test';

// E2E Tests for Task Management
// These tests verify the complete user flows

test.describe('Task Management Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');
  });

  test('should create a new task', async () => {
    // Click the new task input
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Test task from E2E');
    await page.keyboard.press('Enter');

    // Verify task appears
    await expect(page.getByText('Test task from E2E')).toBeVisible();
  });

  test('should toggle task completion', async () => {
    // Create a task
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Task to complete');
    await page.keyboard.press('Enter');

    // Click the checkbox
    await page.click('input[type="checkbox"]');

    // Verify task is marked complete (strikethrough)
    await expect(page.getByText('Task to complete')).toHaveClass(/line-through/);
  });

  test('should delete a task', async () => {
    // Create a task
    await page.click('input[placeholder*="What needs to be done"]');
    await page.keyboard.type('Task to delete');
    await page.keyboard.press('Enter');

    // Hover and click delete
    await page.hover('text=Task to delete');
    await page.click('button:text=Trash2');

    // Verify task is gone
    await expect(page.getByText('Task to delete')).not.toBeVisible();
  });

  test('should switch between views', async () => {
    // Start in list view
    await expect(page.locator('input[placeholder*="What needs to be done"]')).toBeVisible();

    // Switch to board view
    await page.click('button:has-text("Board")');
    await expect(page.locator('.kanban-board')).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('should open command palette with Cmd/Ctrl + K', async ({ page }) => {
    await page.keyboard.down('Meta');
    await page.keyboard.press('k');
    await page.keyboard.up('Meta');

    // Command palette should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should close dialogs with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.down('Meta');
    await page.keyboard.press('k');
    await page.keyboard.up('Meta');

    // Close with Escape
    await page.keyboard.press('Escape');

    // Should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to different views', async ({ page }) => {
    // Test Today view
    await page.click('a:has-text("Today")');
    await expect(page).toHaveURL(/[?&]view=today/);

    // Test All Tasks view
    await page.click('a:has-text("All Tasks")');
    await expect(page).toHaveURL(/[?&]view=all/);
  });
});
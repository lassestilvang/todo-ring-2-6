import { test, expect, type Page } from '@playwright/test';

// Helper functions
async function login(page: Page) {
  // Mock login - in production this would use actual auth
  await page.goto('/auth/login');
}

async function createTask(page: Page, title: string) {
  await page.click('input[type="text"]');
  await page.keyboard.type(title);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/');
    await createTask(page, 'Test task from E2E');

    await expect(page.getByText('Test task from E2E')).toBeVisible();
  });

  test('should toggle task completion', async ({ page }) => {
    await page.goto('/');
    await createTask(page, 'Task to complete');

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();

    await expect(page.getByText('Task to complete')).toHaveClass(/line-through/);
  });

  test('should delete a task', async ({ page }) => {
    await page.goto('/');
    await createTask(page, 'Task to delete');

    await page.locator('button[aria-label="Delete"]').first().click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Task to delete')).not.toBeVisible();
  });

  test('should add subtasks to a task', async ({ page }) => {
    await page.goto('/');
    await createTask(page, 'Task with subtasks');

    // Open task detail
    await page.getByText('Task with subtasks').click();
    await page.waitForTimeout(300);

    // Add subtask
    await page.fill('input[placeholder="Add a subtask..."]', 'New subtask');
    await page.keyboard.press('Enter');

    await expect(page.getByText('New subtask')).toBeVisible();
  });

  test('should set task priority', async ({ page }) => {
    await page.goto('/');
    await createTask(page, 'Priority task');

    // Open task detail
    await page.getByText('Priority task').click();
    await page.waitForTimeout(300);

    // Set high priority
    await page.click('button:has-text("High Priority")');
    await expect(page.locator('button:has-text("High Priority")')).toHaveClass(/bg-primary/);
  });
});

test.describe('Task Views', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
  });

  test('should switch to Kanban view', async ({ page }) => {
    await page.click('button:has-text("Board")');
    await expect(page.locator('[data-view="kanban"]')).toBeVisible();
  });

  test('should switch to Calendar view', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await expect(page.locator('[data-view="calendar"]')).toBeVisible();
  });

  test('should switch to Gantt view', async ({ page }) => {
    await page.click('button:has-text("Gantt")');
    await expect(page.locator('[data-view="gantt"]')).toBeVisible();
  });
});

test.describe('Search and Filter', () => {
  test('should search tasks', async ({ page }) => {
    await login(page);
    await page.goto('/');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('important');

    // Results should be filtered
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(0);
  });

  test('should filter by priority', async ({ page }) => {
    await login(page);
    await page.goto('/');

    // Click filter button
    await page.click('button:has-text("Filter")');
    await page.click('button:has-text("High")');

    // Tasks should be filtered
    await expect(page.locator('[data-testid="task-card"]')).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('should open command palette with Cmd+K', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
  });

  test('should create task with quick add', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await page.keyboard.press('Meta+n');
    await page.keyboard.type('New task from keyboard');
    await page.keyboard.press('Enter');

    await expect(page.getByText('New task from keyboard')).toBeVisible();
  });

  test('should show help with question mark', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await page.keyboard.press('?');
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
  });
});

test.describe('Bulk Operations', () => {
  test('should select multiple tasks', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await createTask(page, 'Task 1');
    await createTask(page, 'Task 2');

    // Select first task
    await page.locator('input[type="checkbox"]').first().click();

    // Selection counter should show
    await expect(page.getByText('1 tasks selected')).toBeVisible();
  });

  test('should select all tasks', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await createTask(page, 'Task 1');
    await createTask(page, 'Task 2');

    // Select all
    await page.keyboard.press('Shift+Meta+a');

    await expect(page.getByText(/tasks selected/)).toBeVisible();
  });
});

test.describe('Task Dependencies', () => {
  test('should add task dependency', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await createTask(page, 'Main task');
    await createTask(page, 'Dependency task');

    // Open task detail
    await page.getByText('Main task').click();
    await page.waitForTimeout(300);

    // Add dependency
    await page.fill('input[placeholder="Enter task title to block this task..."]', 'Dependency task');
    await page.keyboard.press('Enter');

    await expect(page.getByText(/dependency/i)).toBeVisible();
  });
});

test.describe('Notifications', () => {
  test('should display notification settings', async ({ page }) => {
    await login(page);
    await page.goto('/settings');

    await expect(page.getByText('Notifications')).toBeVisible();
  });
});

test.describe('Mobile Experience', () => {
  test('should show mobile bottom bar on small screens', async ({ page }) => {
    await login(page);
    await page.goto('/');

    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile bottom bar should be visible
    await expect(page.locator('.fixed.bottom-0')).toBeVisible();
  });
});
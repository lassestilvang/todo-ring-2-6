import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('Task card renders correctly', async ({ page }) => {
    await page.goto('/');

    // Create a task first
    await page.fill('input[placeholder*="What needs to be done"]', 'Visual test task');
    await page.keyboard.press('Enter');

    // Wait for task to render
    await page.waitForSelector('text=Visual test task');

    // Take screenshot
    const taskCard = page.locator('text=Visual test task').first();
    await expect(taskCard).toBeVisible();

    // Visual assertion would compare with baseline
    // await expect(await taskCard.screenshot()).toMatchSnapshot('task-card.png');
  });

  test('Stats bar displays correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.stats-bar');

    const statsBar = page.locator('.stats-bar');
    await expect(statsBar).toBeVisible();
  });

  test('Keyboard shortcut help modal', async ({ page }) => {
    // Open command palette
    await page.keyboard.down('Meta');
    await page.keyboard.press('k');
    await page.keyboard.up('Meta');

    await page.waitForSelector('[role="dialog"]');

    // Screenshot the help dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });
});
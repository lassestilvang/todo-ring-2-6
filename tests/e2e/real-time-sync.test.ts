import { test, expect, playwright } from '@playwright/test';

// Real-time sync test for task updates
(test.describe('Real-Time Collaboration Test', () => {
  test('Should sync task updates across clients', async ({ page }) => {
    // Arrange
    await page.goto('http://localhost:3000');

    // Act 1: User A creates a task
    await page.fill('#task-title', 'Buy Groceries');
    await page.click('#add-task-button');

    // Act 2: User B should see the task
    const userBPage = await playwright.chromium.launch();
    await userBPage.goto('http://localhost:3000');
    await expect(userBPage.locator('#tasks').hasText('Buy Groceries')).toBeTrue();

    // Cleanup
    await userBPage.close();
  });
}));

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large task lists efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });

    // Create 100 tasks
    for (let i = 1; i <= 100; i++) {
      await page.click('input[placeholder*="What needs to be done"]');
      await page.keyboard.type(`Task ${i}`);
      await page.keyboard.press('Enter');
    }

    // Measure scroll performance
    const startTime = Date.now();
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    const scrollTime = Date.now() - startTime;

    // Scrolling should be smooth (under 500ms for 3 scrolls)
    expect(scrollTime).toBeLessThan(500);
  });

  test('should have fast search response', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });

    // Type search query
    const startTime = Date.now();
    await page.type('input[type="search"]', 'test');
    await page.waitForTimeout(100); // Wait for debounce
    const searchTime = Date.now() - startTime;

    // Search should be responsive (under 200ms)
    expect(searchTime).toBeLessThan(200);
  });

  test('should have efficient memory usage', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });

    // Get memory usage
    const memoryBefore = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Navigate and interact
    for (let i = 0; i < 10; i++) {
      await page.click('input[placeholder*="What needs to be done"]');
      await page.keyboard.type(`Test task ${i}`);
      await page.keyboard.press('Enter');
    }

    // Force garbage collection if available
    await page.evaluate(() => (window as any).gc?.());

    const memoryAfter = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Memory growth should be reasonable (less than 50MB increase)
    if (memoryBefore && memoryAfter) {
      expect(memoryAfter - memoryBefore).toBeLessThan(50 * 1024 * 1024);
    }
  });
});
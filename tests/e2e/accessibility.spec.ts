import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="What needs to be done"]', { timeout: 10000 });
  });

  test('should have no accessibility violations on main page', async () => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async () => {
    const headings = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return elements.map(el => ({ level: parseInt(el.tagName[1]), text: el.textContent }));
    });

    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
  });

  test('should have accessible form inputs', async () => {
    const input = page.locator('input[placeholder*="What needs to be done"]');
    await expect(input).toBeFocused();
  });

  test('should have accessible buttons', async () => {
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      // Each button should have accessible name
      expect(ariaLabel || textContent?.trim()).toBeTruthy();
    }
  });

  test('should be navigable with keyboard', async () => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('BUTTON');
  });

  test('should have sufficient color contrast', async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
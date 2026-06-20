import { test, expect } from '@playwright/test';

test.describe('Time Tracking Reports', () => {
  test('should display time tracking dashboard', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForSelector('[data-testid="time-tracking"]', { timeout: 5000 });
    
    // Check for summary cards
    await expect(page.getByText('Time Spent')).toBeVisible();
    await expect(page.getByText('Estimated')).toBeVisible();
    await expect(page.getByText('Tasks')).toBeVisible();
  });

  test('should switch time periods', async ({ page }) => {
    await page.goto('/analytics');
    
    // Click week tab
    await page.getByRole('combobox').selectOption('week');
    await page.waitForTimeout(500);
    
    // Click month tab
    await page.getByRole('combobox').selectOption('month');
    await page.waitForTimeout(500);
  });

  test('should export CSV', async ({ page }) => {
    await page.goto('/analytics');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export' }).click(),
    ]);
    
    expect(download.suggestedFilename()).toContain('time-tracking');
  });
});

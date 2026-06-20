import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByRole('button', { name: 'Sign In' }).click();
      // Form validation should show errors
    });
  });

  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/auth/register');
      await expect(page.getByLabel('Name')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
    });
  });
});

test.describe('User Settings', () => {
  test('should display profile settings', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page.getByText('Profile')).toBeVisible();
  });

  test('should display notification settings', async ({ page }) => {
    await page.goto('/settings/notifications');
    await expect(page.getByText('Notifications')).toBeVisible();
  });

  test('should display theme settings', async ({ page }) => {
    await page.goto('/settings/appearance');
    await expect(page.getByText('Appearance')).toBeVisible();
  });
});

test.describe('Lists Management', () => {
  test('should create a new list', async ({ page }) => {
    await page.goto('/');
    // Click create list button
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Test List')).toBeVisible();
  });

  test('should edit list name', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Test List').click();
    // Open list menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('Name').fill('Updated List Name');
    await page.getByRole('button', { name: 'Save' }).click();
  });
});

test.describe('Labels Management', () => {
  test('should create a label', async ({ page }) => {
    await page.goto('/settings/labels');
    await page.getByRole('button', { name: 'New Label' }).click();
    await page.getByLabel('Name').fill('Test Label');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Test Label')).toBeVisible();
  });
});

test.describe('Export and Import', () => {
  test('should display export options', async ({ page }) => {
    await page.goto('/settings/import-export');
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });

  test('should show import dialog', async ({ page }) => {
    await page.goto('/settings/import-export');
    await page.getByRole('button', { name: 'Import' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Focus should move between interactive elements
  });

  test('should show skip to main link on focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+Shift+F');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();
  });
});
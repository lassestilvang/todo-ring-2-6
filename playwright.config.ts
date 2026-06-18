import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/config
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Maximum timeout for each test */
  timeout: 30_000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if test.only is left in source */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI, fork new workers on local machine */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: 'html',
  /* Shared settings for all the tests below */
  use: {
    /* Base URL to use in tests */
    baseURL: 'http://localhost:3000',
    /* Collect trace on retry */
    trace: 'on-first-retry',
    /* Expect timeout */
    expect: {
      timeout: 5000,
    },
  },

  /* Configure for projects to test multiple browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Start the application before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
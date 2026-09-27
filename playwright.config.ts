import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.UI_BASE_URL,
    locale: 'en-US',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'ui-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testDir: './tests/ui',
    },
    // Accept: application/json is not optional. Laravel answers a failed
    // validation with a redirect when the client does not ask for JSON, and
    // Playwright follows it — turning a 422 into a confusing 404. The real
    // front end sends this header; so must the suite.
    {
      name: 'api',
      use: {
        baseURL: process.env.API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
      testDir: './tests/api',
    },
    {
      name: 'api-bugs',
      use: {
        baseURL: process.env.API_BUGS_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
      testDir: './tests/api',
    },
  ],
});
import { defineConfig } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  outputDir: 'output/playwright/results',
  timeout: 30000,
  use: {
    // E2E must exercise the same Express process that serves the API and SPA.
    // `vite preview` alone cannot validate API security routes and returns 404.
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: true,
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          args: ['--disable-dev-shm-usage', '--no-sandbox'],
        },
      } as any,
    },
  ],

  webServer: {
    command: 'npm run build && NODE_ENV=production HOST=127.0.0.1 PORT=${PLAYWRIGHT_PORT:-3000} node dist/server.cjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

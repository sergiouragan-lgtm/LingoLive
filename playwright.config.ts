import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
        headless: true,
        launchArgs: ['--disable-dev-shm-usage', '--no-sandbox'],
      } as any,
    },
  ],

  // Note: Dev server must be running separately (npm run dev)
  // The dev server takes 30-60s to initialize due to Express + Vite + dependencies
  // For local testing: run "npm run dev" in another terminal, then "npm run test:e2e"
  // For CI/CD: consider building a preview artifact instead
});

import { test as base, expect, Page } from '@playwright/test';

/**
 * Custom fixtures for E2E tests
 * Provides common utilities and setup/teardown
 */

type CustomFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<CustomFixtures>({
  // Future: Add authentication flow
  // This would set up a logged-in user session
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },
});

/**
 * Helper to wait for the app to be fully interactive
 */
export async function waitForAppReady(page: any, timeout = 5000) {
  await page.waitForLoadState('networkidle');

  // Wait for main content to be visible
  const mainContent = page.locator('main, [role="main"], body > div');
  await mainContent.first().waitFor({ timeout });
}

/**
 * Helper to check for critical console errors
 */
export function filterCriticalErrors(errors: string[]): string[] {
  const ignoredPatterns = [
    'ResizeObserver',
    'Cross-Origin',
    'mediaDevices',
    'getUserMedia',
    'Navigation',
    'Fetch API',
    'XMLHttpRequest',
  ];

  return errors.filter(error =>
    !ignoredPatterns.some(pattern => error.includes(pattern))
  );
}

/**
 * Helper to verify page is responsive and interactive
 */
export async function verifyPageInteractive(page: any) {
  const isInteractive = await page.evaluate(() => {
    return document.body.clientHeight > 0 && document.readyState === 'complete';
  });

  expect(isInteractive).toBe(true);
}

/**
 * Helper to take a screenshot for debugging
 */
export async function debugScreenshot(page: any, testName: string) {
  if (process.env.DEBUG) {
    await page.screenshot({
      path: `tests/e2e/.debug/${testName}-${Date.now()}.png`
    });
  }
}

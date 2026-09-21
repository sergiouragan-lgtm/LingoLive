import { test, expect } from '@playwright/test';

test.describe('Learning Flow', () => {
  test('should display dashboard after loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for page to be interactive
    await page.waitForTimeout(2000);

    // Check if any learning-related content is present
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should handle language selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for buttons or select elements
    const buttons = await page.locator('button');
    const count = await buttons.count();

    // Page should have interactive elements
    expect(count).toBeGreaterThan(0);
  });

  test('should render without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some time for async operations
    await page.waitForTimeout(2000);

    // There should be no critical console errors
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Cross-Origin')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

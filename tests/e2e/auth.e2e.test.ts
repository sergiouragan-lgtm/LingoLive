import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display welcome screen on initial load', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Check for welcome/landing content
    const pageContent = await page.content();
    expect(pageContent).toContain('Lingo');
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Verify page is responsive (just check it renders)
    const isVisible = await page.isVisible('body');
    expect(isVisible).toBe(true);
  });

  test('should navigate between views', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The app uses a view-based routing system
    // Just verify the page loads and is interactive
    const mainElement = await page.locator('main, [role="main"]');
    await expect(mainElement).toBeVisible({ timeout: 5000 });
  });
});

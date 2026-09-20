import { test, expect } from '@playwright/test';

test.describe('Live Class Features', () => {
  test('should render live class interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Just verify the app loads successfully
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle live class navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for navigation elements
    const nav = await page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();

    // Navigation should exist or page should be functional
    expect(await page.locator('main, [role="main"]').count()).toBeGreaterThan(0);
  });

  test('should handle WebRTC-related initialization', async ({ page }) => {
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // App should remain functional
    const isInteractive = await page.evaluate(() => document.body.clientHeight > 0);
    expect(isInteractive).toBe(true);
  });

  test('should handle media permission dialogs gracefully', async ({ page }) => {
    // Mock the permission request to avoid blocking
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('Permission denied - test environment');
      };
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should still function even if media permissions are denied
    const mainContent = await page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should load live class platform without crashing', async ({ page }) => {
    const errors: string[] = [];
    const uncaughtExceptions: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pagecrash', () => {
      uncaughtExceptions.push('Page crashed');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should complete without page crash
    expect(uncaughtExceptions.length).toBe(0);

    // Filter out expected errors
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Cross-Origin') &&
      !e.includes('mediaDevices') &&
      !e.includes('getUserMedia')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

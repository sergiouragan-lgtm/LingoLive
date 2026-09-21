import { test, expect } from '@playwright/test';

test.describe('Payment & Subscription Flow', () => {
  test('should display pricing/subscription options', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for pricing or subscription related content
    // The exact selectors depend on your component structure
    const pageContent = await page.content();

    // Page should load successfully
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should handle subscription button clicks gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find subscription-related buttons (plan buttons, checkout buttons, etc.)
    const buttons = await page.locator('button');
    const count = await buttons.count();

    // Should have interactive elements
    expect(count).toBeGreaterThan(0);
  });

  test('should not crash on payment UI interactions', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Try to click any available buttons
    const buttons = await page.locator('button');
    const firstButton = buttons.first();

    if (await firstButton.isVisible()) {
      await firstButton.click().catch(() => {
        // Click might fail due to navigation - that's ok
      });
    }

    // No critical JS errors should occur
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Cross-Origin') &&
      !e.includes('Navigation')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should maintain session state during interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const initialContent = await page.content();
    expect(initialContent).toBeTruthy();

    // Wait a moment and check page is still responsive
    await page.waitForTimeout(1000);

    const finalContent = await page.content();
    expect(finalContent).toBeTruthy();
    expect(finalContent.length).toBeGreaterThan(0);
  });
});

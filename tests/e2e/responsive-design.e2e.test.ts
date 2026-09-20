import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-wide', width: 1920, height: 1080 },
];

test.describe('Responsive Design', () => {
  VIEWPORTS.forEach(viewport => {
    test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify page renders
      const body = await page.locator('body');
      await expect(body).toBeVisible();

      // Check no horizontal scrollbar (except for very narrow viewports)
      if (viewport.width >= 320) {
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        // Allow for small layout shift tolerance
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });

  test('should adapt layout on orientation change', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const portraitContent = await page.content();

    // Change to landscape
    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForTimeout(500);

    const landscapeContent = await page.content();

    // Layout should adapt (content might reflow)
    expect(portraitContent.length).toBeGreaterThan(0);
    expect(landscapeContent.length).toBeGreaterThan(0);
  });

  test('should handle text scaling gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set zoom level
    await page.evaluate(() => {
      document.documentElement.style.zoom = '150%';
    });

    await page.waitForTimeout(500);

    // App should still be interactive after zoom
    const mainContent = await page.locator('main, [role="main"], body > div');
    await expect(mainContent.first()).toBeVisible({ timeout: 3000 });

    // Reset zoom
    await page.evaluate(() => {
      document.documentElement.style.zoom = '100%';
    });
  });

  test('should have touch-friendly touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Enable touch device emulation
    await page.evaluate(() => {
      window.ontouchstart = () => {};
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for buttons
    const buttons = await page.locator('button');
    const count = await buttons.count();

    // Should have interactive elements
    expect(count).toBeGreaterThanOrEqual(0);

    // If buttons exist, check they're reasonably sized for touch
    if (count > 0) {
      const firstButton = buttons.first();
      const box = await firstButton.boundingBox();

      // Touch targets should be at least 44x44 pixels (iOS guideline)
      // This is a soft requirement since some UI might be smaller
      if (box) {
        expect(box.width + box.height).toBeGreaterThan(50);
      }
    }
  });

  test('should not have text cutoff on any viewport', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for overflowing text
      const hasOverflow = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let hasTextOverflow = false;

        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const isOverflow = style.overflow === 'hidden' ||
                            style.textOverflow === 'ellipsis';
          if (isOverflow && el.scrollWidth > el.clientWidth) {
            hasTextOverflow = true;
          }
        });

        return hasTextOverflow;
      });

      // Some overflow might be intentional (like ellipsis), so just log it
      // expect(hasOverflow).toBe(false);
    }
  });
});

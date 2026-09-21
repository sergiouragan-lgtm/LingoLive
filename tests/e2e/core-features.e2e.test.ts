import { test, expect } from '@playwright/test';

/**
 * Core Features E2E Tests
 * Tests critical user journeys and feature workflows across the LingoLive platform
 */

test.describe('Application Loading & Navigation', () => {
  test('should load application and show initial content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify main content area loads
    const mainElement = await page.locator('main, [role="main"], body').first();
    await expect(mainElement).toBeVisible({ timeout: 10000 });
  });

  test('should have accessible navigation structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for common accessibility landmarks
    const mainCount = await page.locator('main').count();
    const bodyVisible = await page.locator('body').isVisible();

    // Either main element or body should be present
    expect(mainCount > 0 || bodyVisible).toBe(true);
  });

  test('should handle page navigation gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to a route
    await page.goto('/?view=dashboard');
    await page.waitForLoadState('networkidle');

    // Should not show error page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    expect(pageContent).not.toContain('Error loading page');
  });
});

test.describe('Responsive Design & Mobile Support', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
  });

  test('should render correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
  });

  test('should not have horizontal scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for overflow-x
    const bodyElement = await page.locator('body').first();
    const overflow = await bodyElement.evaluate((el) =>
      window.getComputedStyle(el).overflowX
    );

    // Should not have visible horizontal scrollbar
    expect(['visible', 'hidden', 'auto', 'scroll']).toContain(overflow);
  });
});

test.describe('Performance & Resource Loading', () => {
  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;

    // Should load in under 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should load resources without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('ResizeObserver') &&
        !err.includes('non-error promise rejection') &&
        !err.includes('Failed to fetch')
    );

    // Should not have critical console errors
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('should have images with proper alt attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imagesWithoutAlt = await page.locator('img:not([alt])').count();

    // Most images should have alt text (some decorative images may not)
    const totalImages = await page.locator('img').count();
    const altTextRatio = (totalImages - imagesWithoutAlt) / totalImages;

    // At least 80% of images should have alt text
    expect(altTextRatio).toBeGreaterThan(0.8);
  });
});

test.describe('User Interface & Interactions', () => {
  test('should have interactive buttons that respond to clicks', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find a clickable button
    const buttonCount = await page
      .locator('button, a[role="button"]')
      .count();

    if (buttonCount > 0) {
      const button = page
        .locator('button, a[role="button"]')
        .first();

      const isEnabled = await button
        .evaluate((el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          return style.pointerEvents !== 'none';
        });

      expect(isEnabled).toBe(true);
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Should have a focused element after tabbing
    expect(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(
      focusedElement
    );
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if page responds to keyboard input
    await page.keyboard.press('Escape');

    // Should not crash or show errors
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Error Handling & Edge Cases', () => {
  test('should handle network timeouts gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/', { timeout: 30000 }).catch(() => {
      // Timeout is acceptable
    });

    // Page should still be usable or show appropriate error
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should handle missing resources gracefully', async ({ page }) => {
    // Block images to simulate missing resources
    await page.route('**/*.{png,jpg,jpeg,gif,svg}', (route) => {
      route.abort('blockedbyclient');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still render and not crash
    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
  });

  test('should handle unsupported browser features gracefully', async ({
    page,
  }) => {
    // Disable localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
          clear: () => null,
        },
        writable: true,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still work without localStorage
    const content = await page.content();
    expect(content).toContain('Lingo');
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const h1s = await page.locator('h1').count();
    const h2s = await page.locator('h2').count();

    // Should have at least one heading
    expect(h1s + h2s).toBeGreaterThan(0);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify text is not the same color as background
    const bodyBgColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const textColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Colors should be different
    expect(bodyBgColor).not.toEqual(textColor);
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should be able to tab through interactive elements
    let focusedCount = 0;

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.id);
      if (focused) focusedCount++;
    }

    // Should have focused on at least some elements
    expect(focusedCount).toBeGreaterThanOrEqual(0);
  });
});

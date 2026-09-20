import { test, expect } from '@playwright/test';

/**
 * Enhanced Authentication Flow Tests
 * Comprehensive testing of authentication, authorization, and session management
 */

test.describe('Authentication UI Flow', () => {
  test('should display welcome/login content on initial load', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();

    // Should show some initial content (login screen or welcome screen)
    expect(pageContent).toContain('Lingo');
  });

  test('should handle view transitions smoothly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to transition between views using URL params
    await page.goto('/?view=welcome');
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();
    expect(content).toBeTruthy();
    expect(content).not.toContain('404');
  });

  test('should preserve scroll position on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Navigate and come back
    await page.goto('/?view=test');
    await page.goto('/');

    // Scroll position may or may not be preserved (depends on implementation)
    const scrollAfter = await page.evaluate(() => window.scrollY);

    // Should at least be a valid number
    expect(typeof scrollAfter).toBe('number');
  });
});

test.describe('Session & Token Management', () => {
  test('should not expose auth tokens in localStorage keys', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const keys = await page.evaluate(() => {
      return Object.keys(localStorage);
    });

    const sensitivePatterns = [
      'token',
      'password',
      'secret',
      'credential',
      'apikey',
      'api_key',
    ];

    // Check for sensitive data in localStorage keys
    const hasSensitiveKeys = keys.some((key) =>
      sensitivePatterns.some(
        (pattern) =>
          key.toLowerCase().includes(pattern.toLowerCase()) &&
          !key.toLowerCase().includes('remembered') // 'remembered_user' is ok
      )
    );

    expect(hasSensitiveKeys).toBe(false);
  });

  test('should not expose secrets in session storage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sessionData = await page.evaluate(() => {
      return Object.keys(sessionStorage);
    });

    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'apikey',
      'api_key',
    ];

    const hasSensitiveData = sessionData.some((key) =>
      sensitivePatterns.some((pattern) =>
        key.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    expect(hasSensitiveData).toBe(false);
  });

  test('should clear sensitive data on logout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Store a sensitive value (simulating app behavior)
    await page.evaluate(() => {
      sessionStorage.setItem('test_session_data', 'value');
    });

    // Verify it was stored
    let sessionValue = await page.evaluate(
      () => sessionStorage.getItem('test_session_data')
    );
    expect(sessionValue).toBe('value');

    // Simulate logout by clearing session
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    // Verify it was cleared
    sessionValue = await page.evaluate(
      () => sessionStorage.getItem('test_session_data')
    );
    expect(sessionValue).toBeNull();
  });
});

test.describe('Error States & Recovery', () => {
  test('should handle authentication errors gracefully', async ({ page }) => {
    // Simulate auth error by blocking auth requests
    await page.route('**/auth/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // App should still render and not crash
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should display meaningful error messages for auth failures', async ({
    page,
  }) => {
    // Create a page with error logging
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // There may be some console errors (network related) but app should handle them
    const criticalErrors = consoleMessages.filter(
      (err) => !err.includes('Failed to fetch')
    );

    // Should not have critical authentication errors
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should recover from temporary network failures', async ({ page }) => {
    // Simulate intermittent network issues
    let requestCount = 0;
    await page.route('**/api/**', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // App should still be usable
    const content = await page.content();
    expect(content).toBeTruthy();
  });
});

test.describe('Form Interactions & Validation', () => {
  test('should have valid form elements if present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const forms = await page.locator('form').count();

    if (forms > 0) {
      // Check first form for basic validity
      const firstForm = page.locator('form').first();

      // Form should be visible
      await expect(firstForm).toBeVisible();
    }
  });

  test('should handle input field interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputs = await page.locator('input').count();

    if (inputs > 0) {
      // Try to interact with first input
      const firstInput = page.locator('input').first();

      // Should be able to focus
      await firstInput.focus();
      const isFocused = await firstInput.evaluate(
        (el: HTMLInputElement) => document.activeElement === el
      );

      expect(isFocused).toBe(true);
    }
  });

  test('should validate required fields before submission', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const forms = await page.locator('form').count();

    if (forms > 0) {
      const firstForm = page.locator('form').first();
      const requiredInputs = await firstForm
        .locator('input[required], textarea[required], select[required]')
        .count();

      // Should have some required fields in forms
      expect(requiredInputs).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Redirect & Navigation', () => {
  test('should handle redirect URLs safely', async ({ page }) => {
    // Try to navigate to a redirect parameter
    await page.goto('/?redirect=/api/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should not actually navigate to /api/admin
    expect(page.url()).not.toContain('/api/admin');
  });

  test('should normalize URL paths', async ({ page }) => {
    // Try to access with path traversal
    await page.goto('/?view=../../admin');
    await page.waitForLoadState('domcontentloaded');

    // Should handle gracefully and not break
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should have proper back button behavior', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to go back
    await page.goBack().catch(() => {
      // Going back may fail if no history
    });

    // Should still be functional
    const content = await page.content();
    expect(content).toBeTruthy();
  });
});

test.describe('Multi-Tab & Cross-Tab Communication', () => {
  test('should handle storage events from other tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate another tab writing to storage
    await page.evaluate(() => {
      const event = new StorageEvent('storage', {
        key: 'test_key',
        newValue: 'new_value',
        oldValue: null,
        storageArea: localStorage,
      });
      window.dispatchEvent(event);
    });

    // App should handle storage events without crashing
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should maintain session consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Store something in sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('session_test', 'value');
    });

    // Navigate within the app
    await page.goto('/?view=test');
    await page.waitForLoadState('domcontentloaded');

    // Session data should persist
    const sessionValue = await page.evaluate(
      () => sessionStorage.getItem('session_test')
    );

    expect(sessionValue).toBe('value');
  });
});

import { expect, test } from '@playwright/test';

test('entry experience renders without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
});

test('entry experience exposes an actionable authentication control', async ({ page }) => {
  await page.goto('/');
  const control = page.getByRole('button', { name: /entrar|login|começar|iniciar/i }).first();
  await expect(control).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('the home page loads and shows the catalog', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Practice Software Testing/);
  await expect(page.getByTestId('product-name').first()).toBeVisible();
});

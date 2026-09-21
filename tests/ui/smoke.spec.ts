import { test, expect } from '@playwright/test';

test('la home carga y muestra el catálogo', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Practice Software Testing/);
  await expect(page.getByTestId('product-name').first()).toBeVisible();
});
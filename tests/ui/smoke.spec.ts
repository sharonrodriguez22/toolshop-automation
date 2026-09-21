import { test, expect } from '@playwright/test';

test('la home muestra el catálogo de productos', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Practice Software Testing - Toolshop - v5.0');
  await expect(page.getByTestId('product-name').first()).toBeVisible();
});
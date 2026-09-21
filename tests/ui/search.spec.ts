import { test, expect } from '@fixtures/test';

test('buscar filtra el catálogo', async ({ productsPage }) => {
  await productsPage.searchFor('hammer');

  await expect(productsPage.productCards.first()).toBeVisible();
  expect(await productsPage.productCards.count()).toBeGreaterThan(0);
});
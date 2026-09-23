import { test, expect } from '@fixtures/test';

test('searching filters the catalog and every result matches', async ({
  productsPage,
}) => {
  const unfilteredCount = await productsPage.productCards.count();

  await productsPage.searchFor('hammer');

  const names = await productsPage.productNames.allTextContents();

  expect(names.length).toBeGreaterThan(0);
  expect(names.length).toBeLessThan(unfilteredCount);

  for (const name of names) {
    expect(name.toLowerCase()).toContain('hammer');
  }
});

test('a search with no results shows the empty state', async ({
  productsPage,
}) => {
  await productsPage.searchFor('zzzzqqqxyz');

  await expect(productsPage.noResults).toBeVisible();
  expect(await productsPage.productCards.count()).toBe(0);
});

import { test, expect } from '@fixtures/test';

test('buscar filtra el catálogo y todos los resultados coinciden', async ({
  productsPage,
}) => {
  const sinFiltro = await productsPage.productCards.count();

  await productsPage.searchFor('hammer');

  const nombres = await productsPage.productNames.allTextContents();

  expect(nombres.length).toBeGreaterThan(0);
  expect(nombres.length).toBeLessThan(sinFiltro);

  for (const nombre of nombres) {
    expect(nombre.toLowerCase()).toContain('hammer');
  }
});

test('una búsqueda sin resultados muestra el estado vacío', async ({
  productsPage,
}) => {
  await productsPage.searchFor('zzzzqqqxyz');

  await expect(productsPage.noResults).toBeVisible();
  expect(await productsPage.productCards.count()).toBe(0);
});
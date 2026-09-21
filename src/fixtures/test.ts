import { apiTest } from './api';
import { ProductsPage } from '@pages/ProductsPage';
import { ProductsClient } from '@api/ProductsClient';

type TestFixtures = {
  productsPage: ProductsPage;
  productsClient: ProductsClient;
};

export const test = apiTest.extend<TestFixtures>({
  productsPage: async ({ page }, use) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await use(productsPage);
  },

  productsClient: async ({ request }, use) => {
    await use(new ProductsClient(request));
  },
});

export { expect } from '@playwright/test';
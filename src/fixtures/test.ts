import { test as base } from '@playwright/test';
import { ProductsPage } from '@pages/ProductsPage';
import { ProductsClient } from '@api/ProductsClient';

type Fixtures = {
  productsPage: ProductsPage;
  productsClient: ProductsClient;
};

export const test = base.extend<Fixtures>({
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
import { apiTest } from './api';
import { ProductsPage } from '@pages/ProductsPage';
import { ProductDetailPage } from '@pages/ProductDetailPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import { ProductsClient } from '@api/ProductsClient';
import { CartClient } from '@api/CartClient';
import { InvoiceClient } from '@api/InvoiceClient';

type TestFixtures = {
  productsPage: ProductsPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  productsClient: ProductsClient;
  cartClient: CartClient;
  invoiceClient: InvoiceClient;
  catalog: ProductsClient;
  cart: string;
};

export const test = apiTest.extend<TestFixtures>({
  productsPage: async ({ page }, use) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await use(productsPage);
  },

  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  // Clients bound to `request` follow the project's baseURL, so these are the
  // ones under test — including when the api-bugs project points them at the
  // defective build.
  productsClient: async ({ request }, use) => {
    await use(new ProductsClient(request));
  },

  cartClient: async ({ request }, use) => {
    await use(new CartClient(request));
  },

  invoiceClient: async ({ authedRequest }, use) => {
    await use(new InvoiceClient(authedRequest));
  },

  // A read-only view of the real catalog, for tests that need a product before
  // they can begin. Never the subject of an assertion.
  catalog: async ({ apiRequest }, use) => {
    await use(new ProductsClient(apiRequest));
  },

  /**
   * An empty cart, removed when the test ends.
   *
   * Teardown ignores its own failure: a test whose subject is DELETE /carts
   * has already removed this cart, and a cleanup step is not the place to
   * report that.
   */
  cart: async ({ cartClient }, use) => {
    const cartId = await cartClient.create();

    await use(cartId);

    await cartClient.delete(cartId).catch(() => undefined);
  },
});

export { expect } from '@playwright/test';

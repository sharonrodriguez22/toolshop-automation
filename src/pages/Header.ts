import { Page, Locator } from '@playwright/test';

/**
 * The site header, present on every page. Modelled as its own component so
 * the cart badge is defined once instead of in each page that shows it.
 */
export class Header {
  readonly cartLink: Locator;
  readonly cartQuantity: Locator;

  constructor(page: Page) {
    this.cartLink = page.getByTestId('nav-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }
}

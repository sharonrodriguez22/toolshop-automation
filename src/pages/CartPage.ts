import { Page, Locator } from '@playwright/test';
import { Header } from './Header';

export class CartPage {
  readonly header: Header;
  readonly rows: Locator;
  readonly productTitles: Locator;
  readonly subtotal: Locator;
  readonly total: Locator;
  readonly proceedToCheckout: Locator;

  constructor(private readonly page: Page) {
    this.header = new Header(page);
    this.productTitles = page.getByTestId('product-title');
    this.rows = page.locator('tr').filter({ has: this.productTitles });
    this.subtotal = page.getByTestId('cart-subtotal');
    this.total = page.getByTestId('cart-total');
    this.proceedToCheckout = page.getByTestId('proceed-1');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  quantityFor(productName: string): Locator {
    return this.rowFor(productName).getByTestId('product-quantity');
  }

  linePriceFor(productName: string): Locator {
    return this.rowFor(productName).getByTestId('line-price');
  }

  /**
   * The remove control is the one element in this flow with no data-test
   * attribute, so it has to be found structurally, by its class within the
   * product's row. Reported as a testability defect — see the README.
   */
  removeButtonFor(productName: string): Locator {
    return this.rowFor(productName).locator('a.btn-danger');
  }

  async setQuantityFor(productName: string, quantity: number): Promise<void> {
    const response = this.page.waitForResponse(
      (r) => r.url().includes('/carts') && r.request().method() === 'PUT'
    );
    await this.quantityFor(productName).fill(String(quantity));
    await this.quantityFor(productName).blur();
    await response;
  }

  async remove(productName: string): Promise<void> {
    const response = this.page.waitForResponse(
      (r) => r.url().includes('/carts') && r.request().method() === 'DELETE'
    );
    await this.removeButtonFor(productName).click();
    await response;
  }
}

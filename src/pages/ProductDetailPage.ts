import { Page, Locator } from '@playwright/test';
import { Header } from './Header';

export class ProductDetailPage {
  readonly header: Header;
  readonly quantity: Locator;
  readonly addToCart: Locator;

  constructor(private readonly page: Page) {
    this.header = new Header(page);
    this.quantity = page.getByTestId('quantity');
    this.addToCart = page.getByTestId('add-to-cart');
  }

  async goto(productId: string): Promise<void> {
    await this.page.goto(`/product/${productId}`);
    await this.addToCart.waitFor();
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantity.fill(String(quantity));
  }

  /**
   * Adds the product and waits for the item to actually reach the cart.
   *
   * The application makes TWO requests on the first add: POST /carts to create
   * the cart, then POST /carts/{id} to put the item in it. Waiting for the
   * first POST whose URL contains "/carts" matches the creation and returns
   * too early — the item request is then cancelled by the next navigation and
   * the cart shows up empty. The path shape is what tells the two apart.
   */
  async add(): Promise<void> {
    const itemAdded = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/carts\/[^/]+$/.test(new URL(response.url()).pathname)
    );

    await this.addToCart.click();
    await itemAdded;
  }
}

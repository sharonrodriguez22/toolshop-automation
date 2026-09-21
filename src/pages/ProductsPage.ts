import { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly noResults: Locator;
  readonly searchResultCount: Locator;
  private readonly searchInput: Locator;
  private readonly searchSubmit: Locator;

  constructor(private readonly page: Page) {
    this.searchInput       = page.getByTestId('search-query');
    this.searchSubmit      = page.getByTestId('search-submit');
    this.productNames      = page.getByTestId('product-name');
    this.noResults         = page.getByTestId('no-results');
    this.searchResultCount = page.getByTestId('search-result-count');
    this.productCards      = page.locator('[data-test^="product-01"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.productCards.first().waitFor();
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);

    const respuesta = this.page.waitForResponse(
      (r) => r.url().includes('/products/search') && r.status() === 200
    );
    await this.searchSubmit.click();
    await respuesta;
  }

  productByName(name: string): Locator {
    return this.productNames.filter({ hasText: name });
  }
}
import { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly noResults: Locator;
  readonly searchResultCount: Locator;
  private readonly searchInput: Locator;
  private readonly searchSubmit: Locator;
  private readonly searchCompleted: Locator;

  constructor(private readonly page: Page) {
    this.searchInput       = page.getByTestId('search-query');
    this.searchSubmit      = page.getByTestId('search-submit');
    this.productNames      = page.getByTestId('product-name');
    this.noResults         = page.getByTestId('no-results');
    this.searchResultCount = page.getByTestId('search-result-count');
    this.productCards      = page.locator('[data-test^="product-01"]');
    this.searchCompleted   = page.getByTestId('search_completed');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.productCards.first().waitFor();
  }

  /**
   * The app removes the `search_completed` marker when a search starts and
   * re-adds it once the result list has finished rendering. Waiting for the
   * network response is not enough: it arrives while the list still shows the
   * previous results.
   */
  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
    await this.searchCompleted.waitFor({ state: 'attached' });
  }

  productByName(name: string): Locator {
    return this.productNames.filter({ hasText: name });
  }
}

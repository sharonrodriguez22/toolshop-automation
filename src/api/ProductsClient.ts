import { APIRequestContext, APIResponse } from '@playwright/test';
import { Product, Paginated } from './types';

export class ProductsClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(page = 1): Promise<Paginated<Product>> {
    const response = await this.request.get('/products', {
      params: { page },
    });

    if (!response.ok()) {
      throw new Error(
        `GET /products?page=${page} failed with status ${response.status()}`
      );
    }

    return response.json();
  }

  async search(term: string): Promise<Paginated<Product>> {
    const response = await this.request.get('/products/search', {
      params: { q: term },
    });

    if (!response.ok()) {
      throw new Error(
        `GET /products/search failed with status ${response.status()}`
      );
    }

    return response.json();
  }

  async firstAvailable(): Promise<Product> {
    const firstPage = await this.list();

    for (let pageNumber = 1; pageNumber <= firstPage.last_page; pageNumber++) {
      const { data } =
        pageNumber === 1 ? firstPage : await this.list(pageNumber);
      const available = data.find((p) => p.in_stock);
      if (available) return available;
    }

    throw new Error(
      `No product is in stock across the ${firstPage.last_page} pages of the catalog`
    );
  }

  async getById(id: string): Promise<APIResponse> {
    return this.request.get(`/products/${id}`);
  }
}

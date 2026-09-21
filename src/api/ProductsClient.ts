import { APIRequestContext, APIResponse } from '@playwright/test';
import { Product, Paginated } from './types';

export class ProductsClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(page = 1): Promise<Paginated<Product>> {
    const response = await this.request.get('/products', {
      params: { page },
    });

    if (!response.ok()) {
      throw new Error(`GET /products?page=${page} falló: ${response.status()}`);
    }

    return response.json();
  }

  async search(term: string): Promise<Paginated<Product>> {
    const response = await this.request.get('/products/search', {
      params: { q: term },
    });

    if (!response.ok()) {
      throw new Error(`GET /products/search falló: ${response.status()}`);
    }

    return response.json();
  }

  async firstAvailable(): Promise<Product> {
    const primera = await this.list();

    for (let pagina = 1; pagina <= primera.last_page; pagina++) {
      const { data } = pagina === 1 ? primera : await this.list(pagina);
      const disponible = data.find((p) => p.in_stock);
      if (disponible) return disponible;
    }

    throw new Error(
      `Ningún producto en stock en las ${primera.last_page} páginas del catálogo`
    );
  }

  async getById(id: string): Promise<APIResponse> {
    return this.request.get(`/products/${id}`);
  }
}
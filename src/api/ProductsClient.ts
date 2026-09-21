import { APIRequestContext } from '@playwright/test';
import { Product, Paginated } from './types';

export class ProductsClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(page = 1): Promise<Paginated<Product>> {
    const response = await this.request.get('/products', {
      params: { page },
    });
    if (!response.ok()) {
      throw new Error(`GET /products falló: ${response.status()}`);
    }
    return response.json();
  }

  async firstAvailable(): Promise<Product> {
    const { data } = await this.list();
    const product = data.find((p) => p.in_stock);
    if (!product) throw new Error('No hay productos en stock');
    return product;
  }

  async getById(id: string) {
    return this.request.get(`/products/${id}`);
  }
}
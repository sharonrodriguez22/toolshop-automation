import { APIRequestContext, APIResponse } from '@playwright/test';
import { Cart } from './types';

export class CartClient {
  constructor(private readonly request: APIRequestContext) {}

  /** POST /carts -> 201 { id } */
  async create(): Promise<string> {
    const response = await this.request.post('/carts', { data: {} });

    if (response.status() !== 201) {
      throw new Error(
        `POST /carts failed with status ${response.status()}`
      );
    }

    const { id } = await response.json();
    return id;
  }

  /** POST /carts/{cartId} -> 200 { result: 'item added or updated' } */
  async addItem(
    cartId: string,
    productId: string,
    quantity = 1
  ): Promise<APIResponse> {
    return this.request.post(`/carts/${cartId}`, {
      data: { product_id: productId, quantity },
    });
  }

  /** PUT /carts/{cartId}/product/quantity -> 200 */
  async updateQuantity(
    cartId: string,
    productId: string,
    quantity: number
  ): Promise<APIResponse> {
    return this.request.put(`/carts/${cartId}/product/quantity`, {
      data: { product_id: productId, quantity },
    });
  }

  /** GET /carts/{cartId}, throwing on anything but 200. */
  async get(cartId: string): Promise<Cart> {
    const response = await this.getResponse(cartId);

    if (!response.ok()) {
      throw new Error(
        `GET /carts/${cartId} failed with status ${response.status()}`
      );
    }

    return response.json();
  }

  /**
   * The raw response, for the negative cases where the status is the point
   * and throwing would defeat the test.
   */
  async getResponse(cartId: string): Promise<APIResponse> {
    return this.request.get(`/carts/${cartId}`);
  }

  /** DELETE /carts/{cartId}/product/{productId} -> 204 */
  async removeItem(cartId: string, productId: string): Promise<APIResponse> {
    return this.request.delete(`/carts/${cartId}/product/${productId}`);
  }

  /** DELETE /carts/{cartId} -> 204 */
  async delete(cartId: string): Promise<APIResponse> {
    return this.request.delete(`/carts/${cartId}`);
  }
}

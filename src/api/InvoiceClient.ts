import { APIRequestContext, APIResponse } from '@playwright/test';
import { Invoice, InvoicePayload, Paginated } from './types';

export class InvoiceClient {
  constructor(private readonly request: APIRequestContext) {}

  /** POST /invoices — requires authentication. */
  async create(payload: InvoicePayload): Promise<APIResponse> {
    return this.request.post('/invoices', { data: payload });
  }

  /** GET /invoices — the authenticated user's own invoices. */
  async list(): Promise<Paginated<Invoice>> {
    const response = await this.request.get('/invoices');

    if (!response.ok()) {
      throw new Error(`GET /invoices failed with status ${response.status()}`);
    }

    return response.json();
  }
}

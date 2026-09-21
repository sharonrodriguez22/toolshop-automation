import { test, expect } from '@playwright/test';

test('GET /products devuelve una página del catálogo', async ({ request }) => {
  const response = await request.get('/products');

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body.data)).toBeTruthy();
  expect(body.data.length).toBe(body.per_page);
  expect(body.total).toBeGreaterThan(0);
});
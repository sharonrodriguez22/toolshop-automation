import { test, expect } from '@fixtures/test';

test('GET /products returns a page of the catalog', async ({
  productsClient,
}) => {
  const firstPage = await productsClient.list();

  expect(firstPage.current_page).toBe(1);
  expect(firstPage.data.length).toBeGreaterThan(0);
  expect(firstPage.data.length).toBeLessThanOrEqual(firstPage.per_page);
  expect(firstPage.total).toBeGreaterThanOrEqual(firstPage.data.length);
});

test('every product carries a price, a category and a brand', async ({
  productsClient,
}) => {
  const { data } = await productsClient.list();

  for (const product of data) {
    expect(product.id).toBeTruthy();
    expect(product.name).toBeTruthy();
    expect(typeof product.price).toBe('number');
    expect(product.category.name).toBeTruthy();
    expect(product.brand.name).toBeTruthy();
  }
});

test('the API search filters the catalog', async ({ productsClient }) => {
  const all = await productsClient.list();
  const filtered = await productsClient.search('hammer');

  expect(filtered.total).toBeGreaterThan(0);
  expect(filtered.total).toBeLessThan(all.total);
});

test('a nonexistent product returns 404', async ({ productsClient }) => {
  const response = await productsClient.getById('01ZZZZZZZZZZZZZZZZZZZZZZZZ');

  expect(response.status()).toBe(404);
});

test('an authenticated user can read their own profile', async ({
  authedRequest,
}) => {
  const response = await authedRequest.get('/users/me');

  expect(response.status()).toBe(200);

  const profile = await response.json();
  expect(profile.email).toBe(process.env.TEST_USER_EMAIL);
  expect(profile.first_name).toBeTruthy();
});

test('the profile endpoint returns 401 without a token', async ({ request }) => {
  const response = await request.get('/users/me');

  expect(response.status()).toBe(401);
});

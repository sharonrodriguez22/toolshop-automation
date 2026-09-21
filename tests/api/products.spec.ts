import { test, expect } from '@fixtures/test';

test('GET /products devuelve una página del catálogo', async ({
  productsClient,
}) => {
  const pagina = await productsClient.list();

  expect(pagina.current_page).toBe(1);
  expect(pagina.data.length).toBeGreaterThan(0);
  expect(pagina.data.length).toBeLessThanOrEqual(pagina.per_page);
  expect(pagina.total).toBeGreaterThanOrEqual(pagina.data.length);
});

test('cada producto trae precio, categoría y marca', async ({
  productsClient,
}) => {
  const { data } = await productsClient.list();

  for (const producto of data) {
    expect(producto.id).toBeTruthy();
    expect(producto.name).toBeTruthy();
    expect(typeof producto.price).toBe('number');
    expect(producto.category.name).toBeTruthy();
    expect(producto.brand.name).toBeTruthy();
  }
});

test('la búsqueda por API filtra el catálogo', async ({ productsClient }) => {
  const todos = await productsClient.list();
  const filtrados = await productsClient.search('hammer');

  expect(filtrados.total).toBeGreaterThan(0);
  expect(filtrados.total).toBeLessThan(todos.total);
});

test('un producto inexistente devuelve 404', async ({ productsClient }) => {
  const response = await productsClient.getById('01ZZZZZZZZZZZZZZZZZZZZZZZZ');

  expect(response.status()).toBe(404);
});

test('el usuario autenticado puede consultar su perfil', async ({
  authedRequest,
}) => {
  const response = await authedRequest.get('/users/me');

  expect(response.status()).toBe(200);

  const perfil = await response.json();
  expect(perfil.email).toBe(process.env.TEST_USER_EMAIL);
  expect(perfil.first_name).toBeTruthy();
});

test('el perfil sin token devuelve 401', async ({ request }) => {
  const response = await request.get('/users/me');

  expect(response.status()).toBe(401);
});
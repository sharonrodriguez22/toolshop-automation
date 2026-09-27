import { test, expect } from '@fixtures/test';

test('a new cart is created empty', async ({ cart, cartClient }) => {
  const created = await cartClient.get(cart);

  expect(created.id).toBe(cart);
  expect(created.cart_items).toEqual([]);
});

test('adding a product stores it with the requested quantity', async ({
  cart,
  cartClient,
  catalog,
}) => {
  const product = await catalog.firstAvailable();

  const response = await cartClient.addItem(cart, product.id, 2);
  expect(response.status()).toBe(200);

  const { cart_items } = await cartClient.get(cart);

  expect(cart_items).toHaveLength(1);
  expect(cart_items[0].product_id).toBe(product.id);
  expect(cart_items[0].quantity).toBe(2);
  expect(cart_items[0].product.name).toBe(product.name);
});

test('updating the quantity replaces the previous value', async ({
  cart,
  cartClient,
  catalog,
}) => {
  const product = await catalog.firstAvailable();
  await cartClient.addItem(cart, product.id, 2);

  const response = await cartClient.updateQuantity(cart, product.id, 5);
  expect(response.status()).toBe(200);

  const { cart_items } = await cartClient.get(cart);

  expect(cart_items).toHaveLength(1);
  expect(cart_items[0].quantity).toBe(5);
});

test('removing the product empties the cart', async ({
  cart,
  cartClient,
  catalog,
}) => {
  const product = await catalog.firstAvailable();
  await cartClient.addItem(cart, product.id, 1);

  const response = await cartClient.removeItem(cart, product.id);
  expect(response.status()).toBe(204);

  const { cart_items } = await cartClient.get(cart);
  expect(cart_items).toEqual([]);
});

test('deleting the cart makes it unreachable', async ({ cart, cartClient }) => {
  const deleted = await cartClient.delete(cart);
  expect(deleted.status()).toBe(204);

  const afterwards = await cartClient.getResponse(cart);
  expect(afterwards.status()).toBe(404);
});

test('a cart that does not exist returns 404', async ({ cartClient }) => {
  const response = await cartClient.getResponse('01ZZZZZZZZZZZZZZZZZZZZZZZZ');

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({
    message: 'Requested item not found',
  });
});

test('adding to a cart that does not exist returns 404', async ({
  cartClient,
  catalog,
}) => {
  const product = await catalog.firstAvailable();

  const response = await cartClient.addItem(
    '01ZZZZZZZZZZZZZZZZZZZZZZZZ',
    product.id,
    1
  );

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ message: 'Cart not found' });
});

// The two 404s above carry different messages — "Requested item not found" for
// a missing cart on read, "Cart not found" on write. Asserting the message and
// not just the status is what tells those two paths apart.

test('a quantity outside the allowed range is rejected', async ({
  cart,
  cartClient,
  catalog,
}) => {
  const product = await catalog.firstAvailable();

  const tooLow = await cartClient.addItem(cart, product.id, 0);
  expect(tooLow.status()).toBe(422);

  const tooHigh = await cartClient.addItem(cart, product.id, 100);
  expect(tooHigh.status()).toBe(422);
});

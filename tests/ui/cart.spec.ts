import { test, expect } from '@fixtures/test';

const asNumber = (money: string) => Number(money.replace(/[^0-9.]/g, ''));

test('adding a product from its detail page puts it in the cart', async ({
  catalog,
  productDetailPage,
  cartPage,
}) => {
  const product = await catalog.firstAvailable();

  await productDetailPage.goto(product.id);
  await productDetailPage.add();
  await cartPage.goto();

  await expect(cartPage.rowFor(product.name)).toBeVisible();
  await expect(cartPage.quantityFor(product.name)).toHaveValue('1');
});

test('the header badge shows the quantity added', async ({
  catalog,
  productDetailPage,
}) => {
  const product = await catalog.firstAvailable();

  await productDetailPage.goto(product.id);
  await productDetailPage.setQuantity(3);
  await productDetailPage.add();

  await expect(productDetailPage.header.cartQuantity).toHaveText('3');
});

test('changing the quantity updates the line price', async ({
  catalog,
  productDetailPage,
  cartPage,
}) => {
  const product = await catalog.firstAvailable();

  await productDetailPage.goto(product.id);
  await productDetailPage.add();
  await cartPage.goto();

  await expect(cartPage.linePriceFor(product.name)).toHaveText(
    new RegExp(product.price.toFixed(2))
  );

  await cartPage.setQuantityFor(product.name, 4);

  await expect
    .poll(async () =>
      asNumber(await cartPage.linePriceFor(product.name).innerText())
    )
    .toBeCloseTo(product.price * 4, 2);
});

test('removing the only product leaves the cart empty', async ({
  catalog,
  productDetailPage,
  cartPage,
}) => {
  const product = await catalog.firstAvailable();

  await productDetailPage.goto(product.id);
  await productDetailPage.add();
  await cartPage.goto();
  await expect(cartPage.rowFor(product.name)).toBeVisible();

  await cartPage.remove(product.name);

  await expect(cartPage.rowFor(product.name)).toHaveCount(0);
});

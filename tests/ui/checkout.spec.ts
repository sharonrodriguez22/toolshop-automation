import { test, expect } from '@fixtures/test';
import { bankTransfer, lookupAddress } from '@data/checkoutFactory';

test('a signed-in customer can check out and the order reaches the API', async ({
  catalog,
  productDetailPage,
  cartPage,
  checkoutPage,
  invoiceClient,
}) => {
  // EXPECTED TO FAIL — this documents a defect in the application, not in the
  // test. See "Findings" in the README.
  //
  // PaymentComponent.checkPayment() returns of(this.state) synchronously, but
  // this.state is only set inside the subscriber of the validation request it
  // depends on. On the first confirm the returned value is still undefined, so
  // the `if (result === true)` guard is false and the invoice request never
  // fires. The customer is nonetheless shown "Payment was successful", because
  // that banner is bound to the payment-check message rather than to the order
  // having been created.
  //
  // Marked with test.fail() rather than worked around: clicking confirm twice
  // would make this green while hiding a defect that loses real orders. When
  // the application is fixed this reports an unexpected pass, and the
  // annotation comes off.
  test.fail();

  const product = await catalog.firstAvailable();
  const invoicesBefore = (await invoiceClient.list()).total;

  await productDetailPage.goto(product.id);
  await productDetailPage.setQuantity(2);
  await productDetailPage.add();

  await cartPage.goto();
  await expect(cartPage.rowFor(product.name)).toBeVisible();
  await cartPage.proceedToCheckout.click();

  await checkoutPage.continueFromSignIn();

  await checkoutPage.fillAddressFromPostcodeLookup(lookupAddress);
  await expect(checkoutPage.lookupError).toHaveCount(0);

  // The billing form has two asynchronous writers — the postcode lookup and
  // the customer prefill — and they overwrite each other. Checking that the
  // typed values survived turns a silent race into a readable failure.
  await expect(checkoutPage.country).toHaveValue(lookupAddress.country);
  await expect(checkoutPage.postalCode).toHaveValue(lookupAddress.postalCode);

  await checkoutPage.proceedFromAddress.click();

  await checkoutPage.payWithBankTransfer(bankTransfer);

  await expect(checkoutPage.successMessage).toBeVisible();

  // The success banner is the application's own claim. Confirming through the
  // API that an invoice actually exists is what turns it into evidence.
  await expect
    .poll(async () => (await invoiceClient.list()).total)
    .toBe(invoicesBefore + 1);
});

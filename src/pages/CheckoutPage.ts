import { Page, Locator } from '@playwright/test';
import {
  BankTransferDetails,
  BillingAddress,
  CreditCardDetails,
} from '@data/checkoutFactory';

/**
 * Steps 2 to 4 of the checkout wizard: sign-in, billing address, payment.
 * Step 1 is the cart itself and lives in CartPage.
 */
export class CheckoutPage {
  // Step 2 — sign in
  readonly proceedFromSignIn: Locator;

  // Step 3 — billing address
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly lookupLoading: Locator;
  readonly lookupError: Locator;
  readonly proceedFromAddress: Locator;

  // Step 4 — payment
  readonly paymentMethod: Locator;
  readonly bankName: Locator;
  readonly accountName: Locator;
  readonly accountNumber: Locator;
  readonly cardHolderName: Locator;
  readonly creditCardNumber: Locator;
  readonly expirationDate: Locator;
  readonly cvv: Locator;
  readonly finish: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.proceedFromSignIn = page.getByTestId('proceed-2');

    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.lookupLoading = page.getByTestId('postcode-lookup-loading');
    this.lookupError = page.getByTestId('postcode-lookup-error');
    this.proceedFromAddress = page.getByTestId('proceed-3');

    this.paymentMethod = page.getByTestId('payment-method');
    this.bankName = page.getByTestId('bank_name');
    this.accountName = page.getByTestId('account_name');
    this.accountNumber = page.getByTestId('account_number');
    this.cardHolderName = page.getByTestId('card_holder_name');
    this.creditCardNumber = page.getByTestId('credit_card_number');
    this.expirationDate = page.getByTestId('expiration_date');
    this.cvv = page.getByTestId('cvv');
    this.finish = page.getByTestId('finish');
    this.successMessage = page.getByTestId('payment-success-message');
    this.errorMessage = page.getByTestId('payment-error-message');
  }

  /**
   * Leaves the sign-in step and waits for the billing step to be ready.
   *
   * A session restored from storageState is already authenticated, so the step
   * shows only a continue button. Entering the billing step then makes the
   * application fetch the customer's saved address and patch the WHOLE form
   * with it, asynchronously — anything typed before that lands is overwritten.
   *
   * Waiting for the response is not enough: Playwright sees it arrive before
   * the application's own subscriber has written it into the form. The wait is
   * therefore on the effect. Until country, postal code and house number are
   * all set the postcode lookup cannot fire, so the prefill is the only writer,
   * and a street with any value means it has landed.
   *
   * This assumes the account under test has a saved address — the seeded
   * customer does. For an account without one the street would stay empty and
   * this would time out.
   */
  async continueFromSignIn(): Promise<void> {
    const visible = await this.proceedFromSignIn
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (visible) {
      await this.proceedFromSignIn.click();
    }

    await this.page.waitForFunction(() => {
      const field = document.querySelector<HTMLInputElement>(
        '[data-test="street"]'
      );
      return !!field && field.value.trim().length > 0;
    });
  }

  /**
   * Fills the address the way a customer does: pick a country, type a postal
   * code and a house number, and let the application resolve street, city and
   * state from its own postcode lookup.
   *
   * The locality must NOT be typed by hand. The API revalidates the address
   * against that same lookup and rejects a city it did not produce.
   *
   * The wait is on the lookup response itself. An earlier version waited for
   * the street field to hold a value, which looked equivalent and was not: the
   * form arrives pre-filled with the account's address, so that condition was
   * already true and the wait returned before the lookup had replaced the city.
   * The invoice was then rejected with "The city does not belong to the
   * selected country".
   */
  async fillAddressFromPostcodeLookup(
    address: Pick<BillingAddress, 'country' | 'postalCode' | 'houseNumber'>
  ): Promise<void> {
    await this.country.selectOption(address.country);
    await this.postalCode.fill(address.postalCode);

    // The lookup only fires once country, postcode and house number are all
    // present, so the wait is armed before the last of the three.
    const lookup = this.page.waitForResponse((response) =>
      response.url().includes('/postcode-lookup')
    );

    await this.houseNumber.fill(address.houseNumber);
    await this.houseNumber.blur();
    await lookup;
  }

  async payWithBankTransfer(details: BankTransferDetails): Promise<void> {
    await this.paymentMethod.selectOption('bank-transfer');
    await this.bankName.fill(details.bankName);
    await this.accountName.fill(details.accountName);
    await this.accountNumber.fill(details.accountNumber);
    await this.finish.click();
  }

  async payWithCreditCard(details: CreditCardDetails): Promise<void> {
    await this.paymentMethod.selectOption('credit-card');
    await this.creditCardNumber.fill(details.cardNumber);
    await this.expirationDate.fill(details.expirationDate);
    await this.cvv.fill(details.cvv);
    await this.cardHolderName.fill(details.cardHolderName);
    await this.finish.click();
  }
}

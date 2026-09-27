import { InvoicePayload, PaymentMethod } from '@api/types';

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  houseNumber: string;
}

export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface CreditCardDetails {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  cardHolderName: string;
}

/**
 * Payment details are deliberately obvious placeholders. Nothing here is a
 * real account or card; the application under test only checks the shape.
 */
export const bankTransfer: BankTransferDetails = {
  bankName: 'Test Bank',
  accountName: 'Test Account Holder',
  accountNumber: '0000000000',
};

export const creditCard: CreditCardDetails = {
  cardNumber: '0000000000000000',
  expirationDate: '12/2030',
  cvv: '000',
  cardHolderName: 'Test Card Holder',
};

/**
 * A country and postal code whose format the API accepts. The locality is
 * deliberately left out: the application resolves street, city and state from
 * a postcode lookup, and its cross-field validation compares the submitted
 * city against that same lookup. Typing a city by hand would be rejected.
 */
export const lookupAddress = {
  country: 'US',
  postalCode: '10001',
  houseNumber: '42',
};

/**
 * An invoice payload for the API, with NO billing_postal_code.
 *
 * AddressMatchesCountry — the cross-field rule on billing_country — returns
 * early when the postal code is absent, so leaving it out keeps this payload
 * independent of the postcode lookup service. A payload that included one
 * would have to match whatever that service returns for the country.
 */
export function buildInvoicePayload(
  cartId: string,
  overrides: Partial<InvoicePayload> = {}
): InvoicePayload {
  return {
    cart_id: cartId,
    payment_method: 'bank-transfer' as PaymentMethod,
    payment_details: {
      bank_name: bankTransfer.bankName,
      account_name: bankTransfer.accountName,
      account_number: bankTransfer.accountNumber,
    },
    billing_street: 'Test Street 1',
    billing_city: 'Test City',
    billing_country: 'US',
    ...overrides,
  };
}

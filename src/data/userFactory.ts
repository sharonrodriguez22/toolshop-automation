import { faker } from '@faker-js/faker';

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ provider: 'example.test' }),
    password: 'Pass' + faker.string.alphanumeric(8) + '!1',
    ...overrides,
  };
}
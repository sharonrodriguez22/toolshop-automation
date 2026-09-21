import { test as base, request as playwrightRequest, APIRequestContext } from '@playwright/test';

export const test = base.extend<{}, { authedRequest: APIRequestContext }>({
  authedRequest: [async ({}, use) => {
    const context = await playwrightRequest.newContext({
      baseURL: process.env.API_BASE_URL,
    });

    const response = await context.post('/users/login', {
      data: {
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD,
      },
    });
    const { access_token } = await response.json();
    await context.dispose();

    const authed = await playwrightRequest.newContext({
      baseURL: process.env.API_BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${access_token}` },
    });

    await use(authed);
    await authed.dispose();
  }, { scope: 'worker' }],
});
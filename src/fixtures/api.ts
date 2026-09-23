import {
  test as base,
  request as playwrightRequest,
  APIRequestContext,
} from '@playwright/test';

type WorkerFixtures = {
  authedRequest: APIRequestContext;
};

export const apiTest = base.extend<{}, WorkerFixtures>({
  authedRequest: [
    async ({}, use) => {
      const anonymous = await playwrightRequest.newContext({
        baseURL: process.env.API_BASE_URL,
      });

      const login = await anonymous.post('/users/login', {
        data: {
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        },
      });

      if (!login.ok()) {
        throw new Error(`Login failed with status ${login.status()}`);
      }

      const { access_token } = await login.json();
      await anonymous.dispose();

      const authenticated = await playwrightRequest.newContext({
        baseURL: process.env.API_BASE_URL,
        extraHTTPHeaders: { Authorization: `Bearer ${access_token}` },
      });

      await use(authenticated);
      await authenticated.dispose();
    },
    { scope: 'worker' },
  ],
});

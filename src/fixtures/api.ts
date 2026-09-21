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
      const anonimo = await playwrightRequest.newContext({
        baseURL: process.env.API_BASE_URL,
      });

      const login = await anonimo.post('/users/login', {
        data: {
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        },
      });

      if (!login.ok()) {
        throw new Error(`Login falló con status ${login.status()}`);
      }

      const { access_token } = await login.json();
      await anonimo.dispose();

      const autenticado = await playwrightRequest.newContext({
        baseURL: process.env.API_BASE_URL,
        extraHTTPHeaders: { Authorization: `Bearer ${access_token}` },
      });

      await use(autenticado);
      await autenticado.dispose();
    },
    { scope: 'worker' },
  ],
});
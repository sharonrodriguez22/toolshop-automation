import {
  test as base,
  request as playwrightRequest,
  APIRequestContext,
} from '@playwright/test';

type WorkerFixtures = {
  authedRequest: APIRequestContext;
  apiRequest: APIRequestContext;
};

export const apiTest = base.extend<{}, WorkerFixtures>({
  /**
   * An authenticated context against the API.
   *
   * Worker-scoped on purpose: POST /users/login returns a token with
   * expires_in: 300, so logging in per test would waste five seconds of every
   * run on an endpoint that already has its own test, while caching the token
   * globally would risk it expiring mid-run. One login per worker sits well
   * inside the window.
   */
  authedRequest: [
    async ({}, use) => {
      const anonymous = await playwrightRequest.newContext({
        baseURL: process.env.API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
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
        extraHTTPHeaders: {
          Accept: 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      });

      await use(authenticated);
      await authenticated.dispose();
    },
    { scope: 'worker' },
  ],

  /**
   * An unauthenticated context pinned to API_BASE_URL, for UI tests that need
   * real data before they can start — a product id, say.
   *
   * This is deliberately separate from Playwright's own `request` fixture.
   * That one follows the project's baseURL, which is what lets the api-bugs
   * project aim the same specs at the intentionally defective build. Setup
   * data must always come from the real API, whatever the project under test.
   */
  apiRequest: [
    async ({}, use) => {
      const context = await playwrightRequest.newContext({
        baseURL: process.env.API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      });

      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
});

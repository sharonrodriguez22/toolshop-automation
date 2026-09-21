import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('autenticar', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByTestId('email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByTestId('password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/account/);

  await page.context().storageState({ path: authFile });
});
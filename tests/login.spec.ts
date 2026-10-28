import { expect, test } from '../fixtures/fixtures';
import { requireEnv } from '../utils/helpers';

const username = requireEnv('TEST_USER_USERNAME');
const password = requireEnv('TEST_USER_PASSWORD');

// These tests check logging in, so they start without the saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('user logs in with valid credentials', async ({
    loginPage,
    productsPage,
    page,
  }) => {
    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/products$/);
    await expect(productsPage.heading).toBeVisible();
    await expect(productsPage.accountLink(username)).toBeVisible();
  });

  test('user sees an error for a wrong password', async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(username, 'wrong-password');

    await expect(loginPage.errorAlert).toHaveText('Nieprawidłowe hasło');
    await expect(page).toHaveURL(/\/login/);
  });

  test('user logs out', async ({ loginPage, productsPage }) => {
    await loginPage.login(username, password);
    await expect(productsPage.heading).toBeVisible();

    await productsPage.logoutButton.click();

    await expect(loginPage.heading).toBeVisible();
  });
});

test.describe('Access control', () => {
  test('guest is redirected to login from a protected page', async ({
    loginPage,
    page,
  }) => {
    await page.goto('/auth/create-user');

    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fauth%2Fcreate-user/);
    await expect(loginPage.heading).toBeVisible();
  });
});

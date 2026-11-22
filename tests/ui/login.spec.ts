import { test } from '../../fixtures/fixtures';
import { getTestUser } from '../../test-data/users';

// Logging in with valid credentials is tested once, in tests/auth.setup.ts.
// Tests here either need no session (guest) or reuse the saved one.

test.describe('Login as a guest', () => {
  // These tests must start logged out.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('user sees an error for a wrong password', async ({ loginPage }) => {
    await loginPage.open();

    await loginPage.login(getTestUser().username, 'wrong-password');

    await loginPage.expectError('Nieprawidłowe hasło');
    await loginPage.expectToBeOpened();
  });

  test('guest is redirected to login from a protected page', async ({
    createUserPage,
    loginPage,
  }) => {
    await createUserPage.open();

    await loginPage.expectRedirectedFrom(createUserPage.path);
  });
});

test.describe('Logout', () => {
  // Uses the saved session. Logging out only clears this browser context,
  // so other tests keep their session.
  test('user logs out', async ({ productsPage, loginPage }) => {
    await productsPage.open();
    await productsPage.expectToBeOpened();

    await productsPage.header.logout();

    await loginPage.expectToBeOpened();
  });
});

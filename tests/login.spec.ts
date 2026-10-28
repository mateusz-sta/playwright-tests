import { test } from '../fixtures/fixtures';
import { getTestUser } from '../test-data/users';

const user = getTestUser();

// These tests check logging in, so they start without the saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('user logs in with valid credentials', async ({
    loginPage,
    productsPage,
  }) => {
    await loginPage.loginAs(user);

    await productsPage.expectToBeOpened();
    await productsPage.header.expectLoggedInAs(user.username);
  });

  test('user sees an error for a wrong password', async ({ loginPage }) => {
    await loginPage.login(user.username, 'wrong-password');

    await loginPage.expectError('Nieprawidłowe hasło');
    await loginPage.expectToBeOpened();
  });

  test('user logs out', async ({ loginPage, productsPage }) => {
    await loginPage.loginAs(user);
    await productsPage.expectToBeOpened();

    await productsPage.header.logout();

    await loginPage.expectToBeOpened();
  });
});

test.describe('Access control', () => {
  test('guest is redirected to login from a protected page', async ({
    createUserPage,
    loginPage,
  }) => {
    await createUserPage.open();

    await loginPage.expectRedirectedFrom(createUserPage.path);
  });
});

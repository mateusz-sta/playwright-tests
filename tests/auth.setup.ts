import { test as setup } from '../fixtures/fixtures';
import { getTestUser } from '../test-data/users';
import { USER_STORAGE_STATE } from '../utils/constants';

// The only UI test that logs in. Runs before all UI tests (project `setup`,
// see playwright.config.ts) and saves the session they reuse.
setup(
  'user logs in with valid credentials',
  async ({ loginPage, productsPage }) => {
    const user = getTestUser();
    await loginPage.open();

    await loginPage.loginAs(user);

    await productsPage.expectToBeOpened();
    await productsPage.header.expectLoggedInAs(user.username);
    await productsPage.saveSession(USER_STORAGE_STATE);
  },
);

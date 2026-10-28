import { test as setup } from '../fixtures/fixtures';
import { getTestUser } from '../test-data/users';
import { USER_STORAGE_STATE } from '../utils/constants';

setup('log in as test user', async ({ loginPage, productsPage, page }) => {
  await loginPage.open();
  await loginPage.loginAs(getTestUser());
  await productsPage.expectToBeOpened();

  await page.context().storageState({ path: USER_STORAGE_STATE });
});

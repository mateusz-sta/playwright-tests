import { expect, test as setup } from '../fixtures/fixtures';
import { USER_STORAGE_STATE } from '../utils/constants';
import { requireEnv } from '../utils/helpers';

setup('log in as test user', async ({ loginPage, productsPage, page }) => {
  await loginPage.open();
  await loginPage.login(
    requireEnv('TEST_USER_USERNAME'),
    requireEnv('TEST_USER_PASSWORD'),
  );
  await expect(productsPage.heading).toBeVisible();

  await page.context().storageState({ path: USER_STORAGE_STATE });
});

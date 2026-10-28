import { expect, test } from '../fixtures/fixtures';
import { requireEnv } from '../utils/helpers';

test.describe('Products', () => {
  test('logged-in user opens the product list without logging in again', async ({
    productsPage,
    page,
  }) => {
    await productsPage.open();

    await expect(page).toHaveURL(/\/products$/);
    await expect(productsPage.heading).toBeVisible();
    await expect(
      productsPage.accountLink(requireEnv('TEST_USER_USERNAME')),
    ).toBeVisible();
  });
});

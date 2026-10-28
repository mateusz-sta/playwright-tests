import { test } from '../../fixtures/fixtures';
import { getTestUser } from '../../test-data/users';

test.describe('Products', () => {
  test('logged-in user opens the product list without logging in again', async ({
    productsPage,
  }) => {
    await productsPage.open();

    await productsPage.expectToBeOpened();
    await productsPage.header.expectLoggedInAs(getTestUser().username);
  });
});

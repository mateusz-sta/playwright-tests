import { expect, test } from '../fixtures/fixtures';

test.describe('Smoke', () => {
  test('home page loads', async ({ homePage, page }) => {
    await homePage.open();

    await expect(page).toHaveTitle(/.+/);
    await expect(homePage.body).toBeVisible();
  });
});

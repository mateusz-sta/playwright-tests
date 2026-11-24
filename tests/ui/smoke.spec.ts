import { test } from '../../fixtures/fixtures';
import { APP_TITLE } from '../../test-data/ui';

test.describe('Smoke', () => {
  test('home page loads', async ({ homePage }) => {
    await homePage.open();

    await homePage.expectTitle(APP_TITLE);
  });
});

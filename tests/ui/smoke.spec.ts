import { test } from '../../fixtures/fixtures';

test.describe('Smoke', () => {
  test('home page loads', async ({ homePage }) => {
    await homePage.open();

    await homePage.expectTitle(/Magazyn/);
  });
});

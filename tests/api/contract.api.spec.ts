import spec from '../../api/openapi.json';
import { expect, test } from '../../fixtures/fixtures';

// Response schemas in the tests come from the saved copy of the docs (api/openapi.json).
// This test tells you when the live docs change – then run `npm run api:update-spec`,
// review the diff and adjust the tests.
test('API docs match the saved copy used by the tests', async ({ request }) => {
  const response = await request.get('/api/docs-json');

  expect(response.status()).toBe(200);
  expect(
    await response.json(),
    'API docs changed – run `npm run api:update-spec`',
  ).toEqual(spec);
});

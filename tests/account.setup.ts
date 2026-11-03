import { AuthApi } from '../api/AuthApi';
import { expect, test as setup } from '../fixtures/fixtures';
import { ensureTestUserExists } from '../test-data/testAccount';
import { getTestUser } from '../test-data/users';
import { waitForApp } from '../utils/waitForApp';

// Runs before all other tests (see `account-setup` in playwright.config.ts).
// If it fails, UI and API tests are not started – one clear error instead of many.
setup(
  'the app is up and the test user can log in',
  async ({ playwright, request }) => {
    const attempts = await waitForApp(request);
    setup.info().annotations.push({
      type: 'app wake-up',
      description: `answered after ${attempts} attempt(s)`,
    });

    const result = await ensureTestUserExists(playwright.request, request);
    setup.info().annotations.push({ type: 'test user', description: result });

    const login = await new AuthApi(request).login(getTestUser());
    expect(login.status()).toBe(200);
  },
);

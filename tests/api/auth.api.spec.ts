import { AuthApi } from '../../api/AuthApi';
import { CurrentUser, LoginResponse } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { getTestUser } from '../../test-data/users';
import { requireEnv } from '../../utils/helpers';

const user = getTestUser();
let token: string;

test.describe('API: auth', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({
      baseURL: requireEnv('BASE_URL'),
    });
    token = await new AuthApi(request).getToken(user);
    await request.dispose();
  });

  test.describe('POST /api/auth/login', () => {
    test('returns a token for valid credentials', async ({ authApi }) => {
      const response = await authApi.login(user);

      expect(response.status()).toBe(200);
      const body: LoginResponse = await response.json();
      expect(body).toEqual({
        accessToken: expect.any(String),
        expiresAt: expect.any(String),
        username: user.username.toLowerCase(),
      });
      expect(Date.parse(body.expiresAt)).toBeGreaterThan(Date.now());
    });

    // Uses a user that does not exist, so failed attempts never lock the test account (429).
    // The specific message is intended: it tells which usernames exist on the environment.
    test('rejects an unknown user', async ({ authApi }) => {
      const response = await authApi.login({
        username: 'unknown.user',
        password: 'wrong-password',
      });

      expect(response.status()).toBe(401);
      await expect(response.json()).resolves.toHaveProperty(
        'message',
        'Użytkownik nie istnieje',
      );
    });
  });

  test.describe('GET /api/auth/me', () => {
    test('returns the logged-in user', async ({ authApi }) => {
      const response = await authApi.me(token);

      expect(response.status()).toBe(200);
      const body: CurrentUser = await response.json();
      expect(body).toEqual({
        id: expect.any(Number),
        username: user.username.toLowerCase(),
      });
    });

    test('requires a token', async ({ authApi }) => {
      const response = await authApi.me();

      expect(response.status()).toBe(401);
    });

    test('rejects an invalid token', async ({ authApi }) => {
      const response = await authApi.me('not-a-valid-token');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/auth/refresh', () => {
    test('returns a new working token for a logged-in user', async ({
      authApi,
    }) => {
      const response = await authApi.refresh(token);

      expect(response.status()).toBe(200);
      const body: LoginResponse = await response.json();
      expect(body.username).toBe(user.username.toLowerCase());
      expect(Date.parse(body.expiresAt)).toBeGreaterThan(Date.now());
      await expect(
        (await authApi.me(body.accessToken)).json(),
      ).resolves.toEqual(
        expect.objectContaining({ username: user.username.toLowerCase() }),
      );
    });

    test('requires a token', async ({ authApi }) => {
      const response = await authApi.refresh();

      expect(response.status()).toBe(401);
    });
  });
});

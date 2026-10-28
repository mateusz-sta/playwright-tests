import { CurrentUser, LoginResponse } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { getTestUser } from '../../test-data/users';

const user = getTestUser();

test.describe('API: auth', () => {
  test('POST /api/auth/login returns a token for valid credentials', async ({
    authApi,
  }) => {
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
  test('POST /api/auth/login rejects an unknown user', async ({ authApi }) => {
    const response = await authApi.login({
      username: 'unknown.user',
      password: 'wrong-password',
    });

    expect(response.status()).toBe(401);
  });

  test('GET /api/auth/me returns the logged-in user', async ({ authApi }) => {
    const token = await authApi.getToken(user);

    const response = await authApi.me(token);

    expect(response.status()).toBe(200);
    const body: CurrentUser = await response.json();
    expect(body).toEqual({
      id: expect.any(Number),
      username: user.username.toLowerCase(),
    });
  });

  test('GET /api/auth/me requires a token', async ({ authApi }) => {
    const response = await authApi.me();

    expect(response.status()).toBe(401);
  });
});

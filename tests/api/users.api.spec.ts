import { AuthApi } from '../../api/AuthApi';
import { UsersApi } from '../../api/UsersApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { CurrentUser, ErrorResponse } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { getTestUser } from '../../test-data/users';

test.describe('API: users', () => {
  test('GET /api/users lists users including the logged-in one', async ({
    usersApi,
  }) => {
    const response = await usersApi.list();

    expect(response.status()).toBe(200);
    const body: CurrentUser[] = await response.json();
    expect(body).toMatchSchema('CurrentUserDto[]');
    expect(body).toContainEqual({
      id: expect.any(Number),
      username: getTestUser().username.toLowerCase(),
    });
  });

  test('POST /api/users creates a user', async ({ testData, usersApi }) => {
    const newUser = testData.userRequest();

    const response = await usersApi.create(newUser);

    expect(response.status()).toBe(201);
    expect<unknown>(await response.json()).toMatchSchema('CurrentUserDto');
    await expect(response.json()).resolves.toEqual({
      id: expect.any(Number),
      username: newUser.username,
    });
  });

  test('POST /api/users rejects a duplicate username', async ({
    testData,
    usersApi,
  }) => {
    const user = await testData.user();

    const response = await usersApi.create(user);

    expect(response.status()).toBe(409);
  });

  test('POST /api/users rejects a too short password', async ({
    testData,
    usersApi,
  }) => {
    const response = await usersApi.create(
      testData.userRequest({ password: 'short' }),
    );

    expect(response.status()).toBe(400);
    const body: ErrorResponse = await response.json();
    expect(body.statusCode).toBe(400);
  });

  test('new user can log in and change the password', async ({
    playwright,
    testData,
  }) => {
    const user = await testData.user();
    const userApi = await createAuthorizedContext(playwright.request, user);
    const auth = new AuthApi(userApi);

    const wrongCurrent = await auth.changePassword({
      currentPassword: 'not-my-password',
      newPassword: 'Password456',
    });
    const changed = await auth.changePassword({
      currentPassword: user.password,
      newPassword: 'Password456',
    });
    const loginWithNew = await auth.login({
      username: user.username,
      password: 'Password456',
    });
    const ownDelete = await new UsersApi(userApi).delete(user.username);
    await userApi.dispose();

    expect(wrongCurrent.status()).toBe(400);
    expect(changed.status()).toBe(204);
    expect(loginWithNew.status()).toBe(200);
    // Users cannot delete their own account.
    expect(ownDelete.status()).toBe(400);
  });

  test('DELETE /api/users/{username} deletes the user', async ({
    testData,
    usersApi,
  }) => {
    const user = await testData.user();

    const response = await usersApi.delete(user.username);

    expect(response.status()).toBe(204);
    await expect(
      usersApi.list().then((r) => r.json()),
    ).resolves.not.toContainEqual(
      expect.objectContaining({ username: user.username }),
    );
  });

  test('DELETE /api/users/{username} returns 404 for a missing user', async ({
    testData,
    usersApi,
  }) => {
    const response = await usersApi.delete(testData.userRequest().username);

    expect(response.status()).toBe(404);
  });
});

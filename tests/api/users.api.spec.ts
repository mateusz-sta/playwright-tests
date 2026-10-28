import { AuthApi } from '../../api/AuthApi';
import { UsersApi } from '../../api/UsersApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { CreateUserRequest, CurrentUser, ErrorResponse } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { deleteIgnoringMissing } from '../../test-data/catalog';
import { buildUsername } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

const testUser = getTestUser();
const newUser: CreateUserRequest = {
  username: buildUsername(),
  password: 'Password123',
};

let api: APIRequestContext;
let users: UsersApi;

// Steps depend on each other (create → use → delete), so they run in order.
test.describe.configure({ mode: 'serial' });

test.describe('API: users', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, testUser);
    users = new UsersApi(api);
  });

  test.afterAll(async () => {
    await deleteIgnoringMissing(await users.delete(newUser.username));
    await api.dispose();
  });

  test('GET /api/users lists users including the logged-in one', async () => {
    const response = await users.list();

    expect(response.status()).toBe(200);
    const body: CurrentUser[] = await response.json();
    expect(body).toMatchSchema('CurrentUserDto[]');
    expect(body).toContainEqual({
      id: expect.any(Number),
      username: testUser.username.toLowerCase(),
    });
  });

  test('POST /api/users creates a user', async () => {
    const response = await users.create(newUser);

    expect(response.status()).toBe(201);
    expect<unknown>(await response.json()).toMatchSchema('CurrentUserDto');
    await expect(response.json()).resolves.toEqual({
      id: expect.any(Number),
      username: newUser.username,
    });
  });

  test('POST /api/users rejects a duplicate username', async () => {
    const response = await users.create(newUser);

    expect(response.status()).toBe(409);
  });

  test('POST /api/users rejects a too short password', async () => {
    const response = await users.create({
      username: buildUsername(),
      password: 'short',
    });

    expect(response.status()).toBe(400);
    const body: ErrorResponse = await response.json();
    expect(body.statusCode).toBe(400);
  });

  test('new user can log in and change the password', async ({
    playwright,
  }) => {
    const userApi = await createAuthorizedContext(playwright.request, newUser);
    const auth = new AuthApi(userApi);

    const wrongCurrent = await auth.changePassword({
      currentPassword: 'not-my-password',
      newPassword: 'Password456',
    });
    const changed = await auth.changePassword({
      currentPassword: newUser.password,
      newPassword: 'Password456',
    });
    const loginWithNew = await auth.login({
      username: newUser.username,
      password: 'Password456',
    });
    const ownDelete = await new UsersApi(userApi).delete(newUser.username);
    await userApi.dispose();

    expect(wrongCurrent.status()).toBe(400);
    expect(changed.status()).toBe(204);
    expect(loginWithNew.status()).toBe(200);
    // Users cannot delete their own account.
    expect(ownDelete.status()).toBe(400);
  });

  test('DELETE /api/users/{username} deletes the user', async () => {
    const response = await users.delete(newUser.username);

    expect(response.status()).toBe(204);
    await expect(
      users.list().then((r) => r.json()),
    ).resolves.not.toContainEqual(
      expect.objectContaining({ username: newUser.username }),
    );
  });

  test('DELETE /api/users/{username} returns 404 for a missing user', async () => {
    const response = await users.delete(newUser.username);

    expect(response.status()).toBe(404);
  });
});

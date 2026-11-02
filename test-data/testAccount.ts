import { AuthApi } from '../api/AuthApi';
import { UsersApi } from '../api/UsersApi';
import { createAuthorizedContext } from '../api/apiContext';
import { ErrorResponse, LoginRequest } from '../api/types';
import { requireEnv } from '../utils/helpers';
import { getTestUser } from './users';
import { APIRequest, APIRequestContext } from '@playwright/test';

// The app answers an unknown username with this message (intended behaviour).
const USER_NOT_FOUND = 'Użytkownik nie istnieje';

function getAdminUser(): LoginRequest {
  return {
    username: requireEnv('ADMIN_USERNAME'),
    password: requireEnv('ADMIN_PASSWORD'),
  };
}

// Makes sure the test user exists, e.g. after the test database was reset.
// Logs in once; creates the user with the admin account only when the app says
// the user does not exist. Any other failure stops with a clear message instead of
// retrying – repeated failed logins get blocked by the API (429).
export async function ensureTestUserExists(
  apiRequest: APIRequest,
  request: APIRequestContext,
): Promise<'existed' | 'created'> {
  const user = getTestUser();
  const login = await new AuthApi(request).login(user);
  if (login.status() === 200) return 'existed';

  const error = (await login.json()) as ErrorResponse;
  if (login.status() === 429) {
    throw new Error(
      'Too many failed logins – the API blocks them for a while. Wait a few minutes and run again.',
    );
  }
  if (login.status() !== 401 || error.message !== USER_NOT_FOUND) {
    throw new Error(
      `Test user "${user.username}" exists but cannot log in (${login.status()}: ${String(error.message)}). ` +
        'Check TEST_USER_PASSWORD in .env / repository secrets.',
    );
  }

  const admin = await createAuthorizedContext(apiRequest, getAdminUser());
  const created = await new UsersApi(admin).create({
    username: user.username.toLowerCase(),
    password: user.password,
  });
  await admin.dispose();
  if (created.status() !== 201) {
    throw new Error(
      `Could not create test user "${user.username}": ${created.status()} ${await created.text()}`,
    );
  }
  return 'created';
}

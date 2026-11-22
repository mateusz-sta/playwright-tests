import { requireEnv } from '../utils/helpers';
import { AuthApi } from './AuthApi';
import { LoginRequest } from './types';
import { APIRequest, APIRequestContext } from '@playwright/test';
import { readFileSync } from 'fs';

// Logs in and returns a request context that sends `Authorization: Bearer <token>`
// with every request. Use it in test.beforeAll and dispose it in test.afterAll.
export async function createAuthorizedContext(
  apiRequest: APIRequest,
  credentials: LoginRequest,
): Promise<APIRequestContext> {
  const baseURL = requireEnv('BASE_URL');

  const anonymous = await apiRequest.newContext({ baseURL });
  const token = await new AuthApi(anonymous).getToken(credentials);
  await anonymous.dispose();

  return apiRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

// Returns a request context that reuses the token of a session saved by
// tests/auth.setup.ts, so the API calls need no login of their own.
export async function createContextFromSavedSession(
  apiRequest: APIRequest,
  storageStatePath: string,
): Promise<APIRequestContext> {
  const baseURL = requireEnv('BASE_URL');

  return apiRequest.newContext({
    baseURL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${readSavedToken(storageStatePath)}`,
    },
  });
}

interface StorageState {
  origins: { localStorage: { name: string; value: string }[] }[];
}

// The app keeps its session in localStorage under "magazyn.session".
function readSavedToken(storageStatePath: string): string {
  const state = JSON.parse(
    readFileSync(storageStatePath, 'utf8'),
  ) as StorageState;
  const session = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((item) => item.name === 'magazyn.session');
  if (!session) {
    throw new Error(
      `No saved session in ${storageStatePath} – run the "setup" project first.`,
    );
  }
  return (JSON.parse(session.value) as { token: string }).token;
}

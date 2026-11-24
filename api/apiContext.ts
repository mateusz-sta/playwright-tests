import { requireEnv } from '../utils/helpers';
import { AuthApi } from './AuthApi';
import { LoginRequest } from './types';
import { APIRequest, APIRequestContext } from '@playwright/test';
import { readFileSync } from 'fs';

// Request context that sends `Authorization: Bearer <token>` with every request.
// Dispose it when it is no longer needed.
export async function createContextWithToken(
  apiRequest: APIRequest,
  token: string,
): Promise<APIRequestContext> {
  return apiRequest.newContext({
    baseURL: requireEnv('BASE_URL'),
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

export async function createAuthorizedContext(
  apiRequest: APIRequest,
  credentials: LoginRequest,
): Promise<APIRequestContext> {
  return createContextWithToken(
    apiRequest,
    await logIn(apiRequest, credentials),
  );
}

export async function logIn(
  apiRequest: APIRequest,
  credentials: LoginRequest,
): Promise<string> {
  const anonymous = await apiRequest.newContext({
    baseURL: requireEnv('BASE_URL'),
  });
  const token = await new AuthApi(anonymous).getToken(credentials);
  await anonymous.dispose();
  return token;
}

interface StorageState {
  origins: { localStorage: { name: string; value: string }[] }[];
}

// Token of the session saved by tests/auth.setup.ts – no login needed.
// The app keeps its session in localStorage under "magazyn.session".
export function readSavedToken(storageStatePath: string): string {
  const state = JSON.parse(
    readFileSync(storageStatePath, 'utf8'),
  ) as StorageState;
  const item = state.origins
    .flatMap((origin) => origin.localStorage)
    .find(({ name }) => name === 'magazyn.session');
  if (!item) {
    throw new Error(
      `No saved session in ${storageStatePath} – run the "setup" project first.`,
    );
  }
  const session = JSON.parse(item.value) as {
    token: string;
    expiresAt: string;
  };
  if (Date.parse(session.expiresAt) <= Date.now()) {
    throw new Error(
      `The session in ${storageStatePath} expired at ${session.expiresAt} – run the "setup" project again.`,
    );
  }
  return session.token;
}

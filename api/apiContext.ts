import { requireEnv } from '../utils/helpers';
import { AuthApi } from './AuthApi';
import { LoginRequest } from './types';
import { APIRequest, APIRequestContext } from '@playwright/test';

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

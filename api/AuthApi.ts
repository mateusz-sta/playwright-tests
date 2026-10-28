import { ChangePasswordRequest, LoginRequest, LoginResponse } from './types';
import { APIRequestContext, APIResponse, expect } from '@playwright/test';

// Client for the /api/auth endpoints. Methods return the raw response,
// so tests can check status codes and bodies themselves.
// `token` is optional: pass it when the request context has no Authorization header.
export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async login(credentials: LoginRequest): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: credentials });
  }

  async refresh(token?: string): Promise<APIResponse> {
    return this.request.post('/api/auth/refresh', {
      headers: bearer(token),
    });
  }

  async me(token?: string): Promise<APIResponse> {
    return this.request.get('/api/auth/me', { headers: bearer(token) });
  }

  async changePassword(
    body: ChangePasswordRequest,
    token?: string,
  ): Promise<APIResponse> {
    return this.request.post('/api/auth/change-password', {
      data: body,
      headers: bearer(token),
    });
  }

  // Helper for tests that only need a valid token as a precondition.
  async getToken(credentials: LoginRequest): Promise<string> {
    const response = await this.login(credentials);
    expect(response.status()).toBe(200);
    const body: LoginResponse = await response.json();
    return body.accessToken;
  }
}

function bearer(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

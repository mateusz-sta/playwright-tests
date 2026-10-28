import { LoginRequest, LoginResponse } from './types';
import { APIRequestContext, APIResponse, expect } from '@playwright/test';

// Client for the /api/auth endpoints. Methods return the raw response,
// so tests can check status codes and bodies themselves.
export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async login(credentials: LoginRequest): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: credentials });
  }

  async me(token?: string): Promise<APIResponse> {
    return this.request.get('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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

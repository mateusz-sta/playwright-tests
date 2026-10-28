import { CreateUserRequest } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/users – needs an authorized request context.
export class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<APIResponse> {
    return this.request.get('/api/users');
  }

  async create(body: CreateUserRequest): Promise<APIResponse> {
    return this.request.post('/api/users', { data: body });
  }

  async delete(username: string): Promise<APIResponse> {
    return this.request.delete(`/api/users/${encodeURIComponent(username)}`);
  }
}

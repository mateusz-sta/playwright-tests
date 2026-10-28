import { CreatePlatformRequest, UpdatePlatformRequest } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/platforms – needs an authorized request context.
export class PlatformsApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<APIResponse> {
    return this.request.get('/api/platforms');
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/platforms/${id}`);
  }

  async create(body: CreatePlatformRequest): Promise<APIResponse> {
    return this.request.post('/api/platforms', { data: body });
  }

  async update(id: number, body: UpdatePlatformRequest): Promise<APIResponse> {
    return this.request.patch(`/api/platforms/${id}`, { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/platforms/${id}`);
  }
}

import { SaveSettingRequest } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/me/settings (settings of the logged-in user) – needs an authorized request context.
export class SettingsApi {
  constructor(private readonly request: APIRequestContext) {}

  async getAll(): Promise<APIResponse> {
    return this.request.get('/api/me/settings');
  }

  async save(key: string, body: SaveSettingRequest): Promise<APIResponse> {
    return this.request.put(`/api/me/settings/${key}`, { data: body });
  }

  async delete(key: string): Promise<APIResponse> {
    return this.request.delete(`/api/me/settings/${key}`);
  }
}

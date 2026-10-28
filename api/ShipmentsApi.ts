import { CreateShipmentRequest, UpdateShipmentRequest } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/shipments – needs an authorized request context.
export class ShipmentsApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(filter: { platformId?: number }): Promise<APIResponse> {
    return this.request.get('/api/shipments', { params: filter });
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/shipments/${id}`);
  }

  async create(body: CreateShipmentRequest): Promise<APIResponse> {
    return this.request.post('/api/shipments', { data: body });
  }

  async replace(id: number, body: UpdateShipmentRequest): Promise<APIResponse> {
    return this.request.put(`/api/shipments/${id}`, { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/shipments/${id}`);
  }
}

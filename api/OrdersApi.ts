import { CreateOrderRequest, UpdateOrderRequest } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/orders – needs an authorized request context.
export class OrdersApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<APIResponse> {
    return this.request.get('/api/orders');
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/orders/${id}`);
  }

  async create(body: CreateOrderRequest): Promise<APIResponse> {
    return this.request.post('/api/orders', { data: body });
  }

  async replace(id: number, body: UpdateOrderRequest): Promise<APIResponse> {
    return this.request.put(`/api/orders/${id}`, { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/orders/${id}`);
  }
}

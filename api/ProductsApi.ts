import {
  CreateProductRequest,
  DeleteManyRequest,
  UpdateProductRequest,
} from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/products – needs an authorized request context.
export class ProductsApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<APIResponse> {
    return this.request.get('/api/products');
  }

  async get(id: number | string): Promise<APIResponse> {
    return this.request.get(`/api/products/${id}`);
  }

  async create(body: CreateProductRequest): Promise<APIResponse> {
    return this.request.post('/api/products', { data: body });
  }

  async createBulk(body: CreateProductRequest[]): Promise<APIResponse> {
    return this.request.post('/api/products/bulk', { data: body });
  }

  async update(id: number, body: UpdateProductRequest): Promise<APIResponse> {
    return this.request.patch(`/api/products/${id}`, { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/products/${id}`);
  }

  async deleteBulk(body: DeleteManyRequest): Promise<APIResponse> {
    return this.request.post('/api/products/delete', { data: body });
  }

  async movements(id: number): Promise<APIResponse> {
    return this.request.get(`/api/products/${id}/movements`);
  }
}

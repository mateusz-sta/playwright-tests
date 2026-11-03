import {
  CreatePackageRequest,
  DeleteManyRequest,
  PackagePricingInput,
  UpdatePackageRequest,
} from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/packages – needs an authorized request context.
export class PackagesApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(filter: {
    productId?: number;
    platformId?: number;
  }): Promise<APIResponse> {
    return this.request.get('/api/packages', { params: filter });
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/packages/${id}`);
  }

  async create(body: CreatePackageRequest): Promise<APIResponse> {
    return this.request.post('/api/packages', { data: body });
  }

  async update(id: number, body: UpdatePackageRequest): Promise<APIResponse> {
    return this.request.patch(`/api/packages/${id}`, { data: body });
  }

  async updatePricing(
    id: number,
    body: PackagePricingInput,
  ): Promise<APIResponse> {
    return this.request.put(`/api/packages/${id}/pricing`, { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/packages/${id}`);
  }

  async deleteBulk(body: DeleteManyRequest): Promise<APIResponse> {
    return this.request.post('/api/packages/delete', { data: body });
  }
}

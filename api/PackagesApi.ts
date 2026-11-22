import {
  AmazonPricingInput,
  CreatePackageRequest,
  DeleteManyRequest,
  UpdateAmazonPricingManyRequest,
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

  // Price components per Amazon market (only packages of an AMAZON platform).
  async updateAmazonPricing(
    id: number,
    body: AmazonPricingInput,
  ): Promise<APIResponse> {
    return this.request.put(`/api/packages/${id}/amazon/pricing`, {
      data: body,
    });
  }

  // Many packages at once (Excel import) – all or nothing.
  async updateAmazonPricingMany(
    body: UpdateAmazonPricingManyRequest,
  ): Promise<APIResponse> {
    return this.request.put('/api/packages/amazon/pricing', { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/packages/${id}`);
  }

  async deleteBulk(body: DeleteManyRequest): Promise<APIResponse> {
    return this.request.post('/api/packages/delete', { data: body });
  }
}

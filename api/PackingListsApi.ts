import {
  CreatePackingListRequest,
  UpdatePackingItemRequest,
  UpdatePackingItemsRequest,
  UpdatePackingListRequest,
} from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/packing-lists – needs an authorized request context.
export class PackingListsApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(filter: { platformId?: number }): Promise<APIResponse> {
    return this.request.get('/api/packing-lists', { params: filter });
  }

  async reservations(): Promise<APIResponse> {
    return this.request.get('/api/packing-lists/reservations');
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/packing-lists/${id}`);
  }

  async create(body: CreatePackingListRequest): Promise<APIResponse> {
    return this.request.post('/api/packing-lists', { data: body });
  }

  async replace(
    id: number,
    body: UpdatePackingListRequest,
  ): Promise<APIResponse> {
    return this.request.put(`/api/packing-lists/${id}`, { data: body });
  }

  async updateItemsStatus(
    id: number,
    body: UpdatePackingItemsRequest,
  ): Promise<APIResponse> {
    return this.request.patch(`/api/packing-lists/${id}/items`, { data: body });
  }

  async updateItemStatus(
    id: number,
    itemId: number,
    body: UpdatePackingItemRequest,
  ): Promise<APIResponse> {
    return this.request.patch(`/api/packing-lists/${id}/items/${itemId}`, {
      data: body,
    });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/packing-lists/${id}`);
  }
}

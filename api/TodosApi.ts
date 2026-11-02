import {
  CreateTodoRequest,
  ResolveSkusRequest,
  UpdateTodoItemRequest,
  UpdateTodoItemsRequest,
  UpdateTodoRequest,
} from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/todos ("Do zrobienia" notes) – needs an authorized request context.
export class TodosApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<APIResponse> {
    return this.request.get('/api/todos');
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/todos/${id}`);
  }

  async create(body: CreateTodoRequest): Promise<APIResponse> {
    return this.request.post('/api/todos', { data: body });
  }

  async replace(id: number, body: UpdateTodoRequest): Promise<APIResponse> {
    return this.request.put(`/api/todos/${id}`, { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/todos/${id}`);
  }

  // Pasted SKUs → packages of a platform; saves nothing.
  async resolveSkus(body: ResolveSkusRequest): Promise<APIResponse> {
    return this.request.post('/api/todos/resolve-skus', { data: body });
  }

  async updateItems(
    id: number,
    body: UpdateTodoItemsRequest,
  ): Promise<APIResponse> {
    return this.request.patch(`/api/todos/${id}/items`, { data: body });
  }

  async updateItem(
    id: number,
    itemId: number,
    body: UpdateTodoItemRequest,
  ): Promise<APIResponse> {
    return this.request.patch(`/api/todos/${id}/items/${itemId}`, {
      data: body,
    });
  }
}

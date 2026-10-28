import { CreateDocumentRequest, MovementType } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/documents (stock receipts and issues) – needs an authorized request context.
export class DocumentsApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(filter: {
    type?: MovementType;
    platformId?: number;
  }): Promise<APIResponse> {
    return this.request.get('/api/documents', { params: filter });
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/documents/${id}`);
  }

  async create(body: CreateDocumentRequest): Promise<APIResponse> {
    return this.request.post('/api/documents', { data: body });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/documents/${id}`);
  }
}

import { CreatePhotoFolderRequest, PhotoIdsRequest, UploadFile } from './types';
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/photo-folders and /api/photos – needs an authorized request context.
export class PhotosApi {
  constructor(private readonly request: APIRequestContext) {}

  async listFolders(): Promise<APIResponse> {
    return this.request.get('/api/photo-folders');
  }

  async getFolder(id: number): Promise<APIResponse> {
    return this.request.get(`/api/photo-folders/${id}`);
  }

  async createFolder(body: CreatePhotoFolderRequest): Promise<APIResponse> {
    return this.request.post('/api/photo-folders', { data: body });
  }

  // Deletes the folder and all its photos.
  async deleteFolder(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/photo-folders/${id}`);
  }

  // multipart/form-data with one `files` field per file; all or nothing.
  async upload(folderId: number, files: UploadFile[]): Promise<APIResponse> {
    const form = new FormData();
    for (const file of files) {
      form.append(
        'files',
        new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }),
        file.name,
      );
    }
    return this.request.post(`/api/photo-folders/${folderId}/photos`, {
      multipart: form,
    });
  }

  async reorder(folderId: number, body: PhotoIdsRequest): Promise<APIResponse> {
    return this.request.put(`/api/photo-folders/${folderId}/order`, {
      data: body,
    });
  }

  async deletePhoto(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/photos/${id}`);
  }

  async deletePhotos(body: PhotoIdsRequest): Promise<APIResponse> {
    return this.request.post('/api/photos/delete', { data: body });
  }
}

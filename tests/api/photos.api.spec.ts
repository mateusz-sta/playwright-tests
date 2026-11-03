import { PhotosApi } from '../../api/PhotosApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Photo, PhotoFolder, PhotoFolderDetail } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { deleteIgnoringMissing } from '../../test-data/catalog';
import { TEST_PREFIX, uniqueId } from '../../test-data/factories';
import { buildPng, buildTextFile } from '../../test-data/files';
import { getTestUser } from '../../test-data/users';
import { requireEnv } from '../../utils/helpers';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
// Without Authorization – photo links are public.
let anonymous: APIRequestContext;
let photosApi: PhotosApi;
let folder: PhotoFolder;
let photos: Photo[];

const folderName = `${TEST_PREFIX} ${uniqueId()}`;
const files = [buildPng('first.png'), buildPng('second.png')];

test.describe.configure({ mode: 'serial' });

test.describe('API: photos', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    anonymous = await playwright.request.newContext({
      baseURL: requireEnv('BASE_URL'),
    });
    photosApi = new PhotosApi(api);
  });

  test.afterAll(async () => {
    // beforeAll failed (e.g. login) – nothing was created, nothing to clean up.
    if (!api) return;
    // Deleting the folder also deletes its photos from disk.
    if (folder)
      await deleteIgnoringMissing(await photosApi.deleteFolder(folder.id));
    await anonymous.dispose();
    await api.dispose();
  });

  test('POST /api/photo-folders creates an empty folder', async () => {
    const response = await photosApi.createFolder({ name: folderName });

    expect(response.status()).toBe(201);
    folder = await response.json();
    expect(folder).toMatchSchema('PhotoFolderDto');
    expect(folder).toMatchObject({
      name: folderName,
      photoCount: 0,
      totalSize: 0,
    });
  });

  test('POST /api/photo-folders rejects a duplicate and an empty name', async () => {
    const duplicate = await photosApi.createFolder({ name: folderName });
    const empty = await photosApi.createFolder({ name: '' });

    expect(duplicate.status()).toBe(409);
    expect(empty.status()).toBe(400);
  });

  test('POST /api/photo-folders/{id}/photos uploads images', async () => {
    const response = await photosApi.upload(folder.id, files);

    expect(response.status()).toBe(201);
    photos = await response.json();
    expect(photos).toMatchSchema('PhotoDto[]');
    expect(photos).toEqual([
      expect.objectContaining({
        originalName: 'first.png',
        mimeType: 'image/png',
        size: files[0].buffer.length,
      }),
      expect.objectContaining({
        originalName: 'second.png',
        mimeType: 'image/png',
        size: files[1].buffer.length,
      }),
    ]);
  });

  test('POST /api/photo-folders/{id}/photos accepts only images', async () => {
    const response = await photosApi.upload(folder.id, [
      buildTextFile('notes.txt'),
    ]);

    expect(response.status()).toBe(400);
  });

  test('the photo link is public and returns the uploaded file', async () => {
    const response = await anonymous.get(photos[0].path);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(await response.body()).toEqual(files[0].buffer);
  });

  test('GET /api/photo-folders/{id} returns photos in upload order with totals', async () => {
    const response = await photosApi.getFolder(folder.id);

    expect(response.status()).toBe(200);
    const body: PhotoFolderDetail = await response.json();
    expect(body).toMatchSchema('PhotoFolderDetailDto');
    expect(body.photoCount).toBe(2);
    expect(body.totalSize).toBe(files[0].buffer.length * 2);
    expect(body.photos.map((p) => p.id)).toEqual(photos.map((p) => p.id));
  });

  test('PUT /api/photo-folders/{id}/order changes the order', async () => {
    const reversed = photos.map((p) => p.id).reverse();

    const response = await photosApi.reorder(folder.id, { photoIds: reversed });

    expect(response.status()).toBe(200);
    const body: PhotoFolderDetail = await response.json();
    expect(body).toMatchSchema('PhotoFolderDetailDto');
    expect(body.photos.map((p) => p.id)).toEqual(reversed);
  });

  test('PUT /api/photo-folders/{id}/order needs all photos of the folder', async () => {
    const response = await photosApi.reorder(folder.id, {
      photoIds: [photos[0].id],
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/photo-folders lists the folder', async () => {
    const response = await photosApi.listFolders();

    expect(response.status()).toBe(200);
    const body: PhotoFolder[] = await response.json();
    expect(body).toMatchSchema('PhotoFolderDto[]');
    expect(body).toContainEqual(
      expect.objectContaining({ id: folder.id, photoCount: 2 }),
    );
  });

  test('DELETE /api/photos/{id} deletes a photo and its link stops working', async () => {
    const response = await photosApi.deletePhoto(photos[0].id);

    expect(response.status()).toBe(204);
    expect((await anonymous.get(photos[0].path)).status()).toBe(404);
    expect((await photosApi.deletePhoto(photos[0].id)).status()).toBe(404);
  });

  test('POST /api/photos/delete deletes many photos and rejects an empty list', async () => {
    const response = await photosApi.deletePhotos({
      photoIds: [photos[1].id],
    });
    const empty = await photosApi.deletePhotos({ photoIds: [] });

    expect(response.status()).toBe(204);
    expect(empty.status()).toBe(400);
    const body: PhotoFolderDetail = await (
      await photosApi.getFolder(folder.id)
    ).json();
    expect(body).toMatchObject({ photoCount: 0, totalSize: 0, photos: [] });
  });

  test('DELETE /api/photo-folders/{id} deletes the folder', async () => {
    const response = await photosApi.deleteFolder(folder.id);

    expect(response.status()).toBe(204);
    expect((await photosApi.getFolder(folder.id)).status()).toBe(404);
  });
});

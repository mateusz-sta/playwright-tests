import { PhotosApi } from '../../api/PhotosApi';
import { Photo, PhotoFolder, PhotoFolderDetail } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { buildPng, buildTextFile } from '../../test-data/files';
import { readCreated } from '../../test-data/responses';

const files = [buildPng('first.png'), buildPng('second.png')];

// Two photos in the folder: first.png and second.png.
async function uploadPhotos(
  photosApi: PhotosApi,
  folder: PhotoFolder,
): Promise<Photo[]> {
  return readCreated<Photo[]>(
    await photosApi.upload(folder.id, files),
    'photos',
  );
}

// The `request` fixture sends no Authorization – photo links are public.
test.describe('API: photos', () => {
  test('POST /api/photo-folders creates an empty folder', async ({
    photosApi,
    testData,
  }) => {
    const name = testData.folderName();

    const response = await photosApi.createFolder({ name });

    expect(response.status()).toBe(201);
    const folder: PhotoFolder = await response.json();
    expect(folder).toMatchSchema('PhotoFolderDto');
    expect(folder).toMatchObject({ name, photoCount: 0, totalSize: 0 });
  });

  test('POST /api/photo-folders rejects a duplicate and an empty name', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();

    const duplicate = await photosApi.createFolder({ name: folder.name });
    const empty = await photosApi.createFolder({ name: '' });

    expect(duplicate.status()).toBe(409);
    expect(empty.status()).toBe(400);
  });

  test('POST /api/photo-folders/{id}/photos uploads images', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();

    const response = await photosApi.upload(folder.id, files);

    expect(response.status()).toBe(201);
    const photos: Photo[] = await response.json();
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

  test('POST /api/photo-folders/{id}/photos accepts only images', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();

    const response = await photosApi.upload(folder.id, [
      buildTextFile('notes.txt'),
    ]);

    expect(response.status()).toBe(400);
  });

  test('the photo link is public and returns the uploaded file', async ({
    photosApi,
    request,
    testData,
  }) => {
    const [photo] = await uploadPhotos(photosApi, await testData.photoFolder());

    const response = await request.get(photo.path);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(await response.body()).toEqual(files[0].buffer);
  });

  test('GET /api/photo-folders/{id} returns photos in upload order with totals', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();
    const photos = await uploadPhotos(photosApi, folder);

    const response = await photosApi.getFolder(folder.id);

    expect(response.status()).toBe(200);
    const body: PhotoFolderDetail = await response.json();
    expect(body).toMatchSchema('PhotoFolderDetailDto');
    expect(body.photoCount).toBe(2);
    expect(body.totalSize).toBe(files[0].buffer.length * 2);
    expect(body.photos.map((p) => p.id)).toEqual(photos.map((p) => p.id));
  });

  test('PUT /api/photo-folders/{id}/order changes the order', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();
    const photos = await uploadPhotos(photosApi, folder);
    const reversed = photos.map((p) => p.id).reverse();

    const response = await photosApi.reorder(folder.id, { photoIds: reversed });

    expect(response.status()).toBe(200);
    const body: PhotoFolderDetail = await response.json();
    expect(body).toMatchSchema('PhotoFolderDetailDto');
    expect(body.photos.map((p) => p.id)).toEqual(reversed);
  });

  test('PUT /api/photo-folders/{id}/order needs all photos of the folder', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();
    const [photo] = await uploadPhotos(photosApi, folder);

    const response = await photosApi.reorder(folder.id, {
      photoIds: [photo.id],
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/photo-folders lists the folder', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();
    await uploadPhotos(photosApi, folder);

    const response = await photosApi.listFolders();

    expect(response.status()).toBe(200);
    const body: PhotoFolder[] = await response.json();
    expect(body).toMatchSchema('PhotoFolderDto[]');
    expect(body).toContainEqual(
      expect.objectContaining({ id: folder.id, photoCount: 2 }),
    );
  });

  test('DELETE /api/photos/{id} deletes a photo and its link stops working', async ({
    photosApi,
    request,
    testData,
  }) => {
    const [photo] = await uploadPhotos(photosApi, await testData.photoFolder());

    const response = await photosApi.deletePhoto(photo.id);

    expect(response.status()).toBe(204);
    expect((await request.get(photo.path)).status()).toBe(404);
    expect((await photosApi.deletePhoto(photo.id)).status()).toBe(404);
  });

  test('POST /api/photos/delete deletes many photos and rejects an empty list', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();
    const photos = await uploadPhotos(photosApi, folder);

    const response = await photosApi.deletePhotos({
      photoIds: photos.map((p) => p.id),
    });
    const empty = await photosApi.deletePhotos({ photoIds: [] });

    expect(response.status()).toBe(204);
    expect(empty.status()).toBe(400);
    const body: PhotoFolderDetail = await (
      await photosApi.getFolder(folder.id)
    ).json();
    expect(body).toMatchObject({ photoCount: 0, totalSize: 0, photos: [] });
  });

  test('DELETE /api/photo-folders/{id} deletes the folder', async ({
    photosApi,
    testData,
  }) => {
    const folder = await testData.photoFolder();

    const response = await photosApi.deleteFolder(folder.id);

    expect(response.status()).toBe(204);
    expect((await photosApi.getFolder(folder.id)).status()).toBe(404);
  });
});

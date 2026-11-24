import { Platform } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';

test.describe('API: platforms', () => {
  test('POST /api/platforms creates a platform with kind OTHER by default', async ({
    platformsApi,
    testData,
  }) => {
    const input = testData.platformRequest({ kind: undefined });

    const response = await platformsApi.create(input);

    expect(response.status()).toBe(201);
    const platform: Platform = await response.json();
    expect(platform).toMatchSchema('PlatformDto');
    expect(platform).toEqual({
      id: expect.any(Number),
      name: input.name,
      kind: 'OTHER',
      packageCount: 0,
      documentCount: 0,
      packingListCount: 0,
      createdAt: expect.any(String),
    });
  });

  test('GET /api/platforms/{id} returns the platform', async ({
    platformsApi,
    testData,
  }) => {
    const platform = await testData.platform();

    const response = await platformsApi.get(platform.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(platform);
  });

  test('GET /api/platforms lists the platform', async ({
    platformsApi,
    testData,
  }) => {
    const platform = await testData.platform();

    const response = await platformsApi.list();

    expect(response.status()).toBe(200);
    const body: Platform[] = await response.json();
    expect(body).toMatchSchema('PlatformDto[]');
    expect(body).toContainEqual(platform);
  });

  test('POST /api/platforms rejects a duplicate name', async ({
    platformsApi,
    testData,
  }) => {
    const platform = await testData.platform();

    const response = await platformsApi.create({ name: platform.name });

    expect(response.status()).toBe(409);
  });

  test('PATCH /api/platforms/{id} renames the platform', async ({
    platformsApi,
    testData,
  }) => {
    const platform = await testData.platform();
    const renamed = testData.name('renamed');

    const response = await platformsApi.update(platform.id, { name: renamed });

    expect(response.status()).toBe(200);
    expect<unknown>(await response.json()).toMatchSchema('PlatformDto');
    await expect(response.json()).resolves.toHaveProperty('name', renamed);
  });

  test('DELETE /api/platforms/{id} deletes the platform', async ({
    platformsApi,
    testData,
  }) => {
    const platform = await testData.platform();

    const response = await platformsApi.delete(platform.id);

    expect(response.status()).toBe(204);
    expect((await platformsApi.get(platform.id)).status()).toBe(404);
  });
});

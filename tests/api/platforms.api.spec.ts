import { PlatformsApi } from '../../api/PlatformsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Platform } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { deleteIgnoringMissing } from '../../test-data/catalog';
import { buildPlatform } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let platforms: PlatformsApi;
let platform: Platform;

const input = buildPlatform({ kind: undefined });
const renamed = buildPlatform().name;

test.describe.configure({ mode: 'serial' });

test.describe('API: platforms', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    platforms = new PlatformsApi(api);
  });

  test.afterAll(async () => {
    if (platform) {
      await deleteIgnoringMissing(await platforms.delete(platform.id));
    }
    await api.dispose();
  });

  test('POST /api/platforms creates a platform with kind OTHER by default', async () => {
    const response = await platforms.create(input);

    expect(response.status()).toBe(201);
    platform = await response.json();
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

  test('GET /api/platforms/{id} returns the platform', async () => {
    const response = await platforms.get(platform.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(platform);
  });

  test('GET /api/platforms lists the platform', async () => {
    const response = await platforms.list();

    expect(response.status()).toBe(200);
    const body: Platform[] = await response.json();
    expect(body).toContainEqual(platform);
  });

  test('POST /api/platforms rejects a duplicate name', async () => {
    const response = await platforms.create({ name: input.name });

    expect(response.status()).toBe(409);
  });

  test('PATCH /api/platforms/{id} renames the platform', async () => {
    const response = await platforms.update(platform.id, { name: renamed });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toHaveProperty('name', renamed);
  });

  test('DELETE /api/platforms/{id} deletes the platform', async () => {
    const response = await platforms.delete(platform.id);

    expect(response.status()).toBe(204);
    expect((await platforms.get(platform.id)).status()).toBe(404);
  });
});

import { SettingsApi } from '../../api/SettingsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { UserSettings } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { uniqueId } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

// Own, unique key – never touches the real settings of the test user.
const key = `pwtest.${uniqueId()}`;
const value = { desktop: { order: ['sku', 'name'], hidden: [] } };

let api: APIRequestContext;
let settings: SettingsApi;

test.describe.configure({ mode: 'serial' });

test.describe('API: user settings', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    settings = new SettingsApi(api);
  });

  test.afterAll(async () => {
    await settings.delete(key);
    await api.dispose();
  });

  test('PUT /api/me/settings/{key} saves a setting', async () => {
    const response = await settings.save(key, { value });

    expect(response.status()).toBe(204);
    const all: UserSettings = await (await settings.getAll()).json();
    expect(all[key]).toEqual(value);
  });

  test('PUT /api/me/settings/{key} overwrites an existing setting', async () => {
    const newValue = { desktop: { order: ['name'], hidden: ['sku'] } };

    const response = await settings.save(key, { value: newValue });

    expect(response.status()).toBe(204);
    await expect((await settings.getAll()).json()).resolves.toHaveProperty(
      [key],
      newValue,
    );
  });

  test('PUT /api/me/settings/{key} rejects an invalid key', async () => {
    const response = await settings.save('Invalid-KEY', { value });

    expect(response.status()).toBe(400);
  });

  test('DELETE /api/me/settings/{key} removes the setting', async () => {
    const response = await settings.delete(key);

    expect(response.status()).toBe(204);
    await expect((await settings.getAll()).json()).resolves.not.toHaveProperty([
      key,
    ]);
  });
});

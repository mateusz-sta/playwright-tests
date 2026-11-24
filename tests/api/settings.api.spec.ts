import { UserSettings } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';

const value = { desktop: { order: ['sku', 'name'], hidden: [] } };

test.describe('API: user settings', () => {
  test('PUT /api/me/settings/{key} saves a setting', async ({
    settingsApi,
    testData,
  }) => {
    const key = testData.settingKey();

    const response = await settingsApi.save(key, { value });

    expect(response.status()).toBe(204);
    const all: UserSettings = await (await settingsApi.getAll()).json();
    expect(all[key]).toEqual(value);
  });

  test('PUT /api/me/settings/{key} overwrites an existing setting', async ({
    settingsApi,
    testData,
  }) => {
    const key = testData.settingKey();
    expect((await settingsApi.save(key, { value })).status()).toBe(204);
    const newValue = { desktop: { order: ['name'], hidden: ['sku'] } };

    const response = await settingsApi.save(key, { value: newValue });

    expect(response.status()).toBe(204);
    await expect((await settingsApi.getAll()).json()).resolves.toHaveProperty(
      [key],
      newValue,
    );
  });

  test('PUT /api/me/settings/{key} rejects an invalid key', async ({
    settingsApi,
  }) => {
    const response = await settingsApi.save('Invalid-KEY', { value });

    expect(response.status()).toBe(400);
  });

  test('DELETE /api/me/settings/{key} removes the setting', async ({
    settingsApi,
    testData,
  }) => {
    const key = testData.settingKey();
    expect((await settingsApi.save(key, { value })).status()).toBe(204);

    const response = await settingsApi.delete(key);

    expect(response.status()).toBe(204);
    await expect(
      (await settingsApi.getAll()).json(),
    ).resolves.not.toHaveProperty([key]);
  });
});

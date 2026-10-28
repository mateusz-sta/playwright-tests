import { PackingListsApi } from '../../api/PackingListsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import {
  Package,
  PackingList,
  PackingListSummary,
  ProductReservation,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
} from '../../test-data/catalog';
import { TEST_PREFIX, today, uniqueId } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let packingLists: PackingListsApi;
let catalog: Catalog;
let pkg: Package;
let list: PackingList;

async function reservationFor(
  productId: number,
): Promise<ProductReservation | undefined> {
  const body: ProductReservation[] = await (
    await packingLists.reservations()
  ).json();
  return body.find((r) => r.productId === productId);
}

test.describe.configure({ mode: 'serial' });

test.describe('API: packing lists', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    packingLists = new PackingListsApi(api);
    // Package = 100 pcs of the product.
    catalog = await createCatalog(api, { withPackage: true });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    if (list) await deleteIgnoringMissing(await packingLists.delete(list.id));
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('POST /api/packing-lists creates a list', async () => {
    const name = `${TEST_PREFIX} list ${uniqueId()}`;

    const response = await packingLists.create({
      platformId: catalog.platform.id,
      name,
      date: today(),
      items: [{ packageId: pkg.id, packageCount: 2 }],
    });

    expect(response.status()).toBe(201);
    list = await response.json();
    expect(list).toMatchObject({
      platformId: catalog.platform.id,
      name,
      itemCount: 1,
      doneCount: 0,
      totalPackages: 2,
      items: [
        {
          position: 1,
          packageId: pkg.id,
          unitsPerPackage: 100,
          packageCount: 2,
          units: 200,
          status: 'IN_PROGRESS',
        },
      ],
    });
  });

  test('GET /api/packing-lists/reservations counts units of items in progress', async () => {
    expect(await reservationFor(catalog.product.id)).toEqual({
      productId: catalog.product.id,
      units: 200,
    });
  });

  test('PATCH /api/packing-lists/{id}/items/{itemId} marks an item as done', async () => {
    const response = await packingLists.updateItemStatus(
      list.id,
      list.items[0].id,
      { status: 'DONE' },
    );

    expect(response.status()).toBe(200);
    const body: PackingList = await response.json();
    expect(body.doneCount).toBe(1);
    expect(body.items[0].status).toBe('DONE');
    // Done items are no longer reserved.
    expect(await reservationFor(catalog.product.id)).toBeUndefined();
  });

  test('PATCH /api/packing-lists/{id}/items changes many items at once', async () => {
    const response = await packingLists.updateItemsStatus(list.id, {
      itemIds: list.items.map((i) => i.id),
      status: 'IN_PROGRESS',
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toHaveProperty('doneCount', 0);
  });

  test('PUT /api/packing-lists/{id} replaces items', async () => {
    const response = await packingLists.replace(list.id, {
      note: 'Updated by API tests',
      items: [{ packageId: pkg.id, packageCount: 5 }],
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      note: 'Updated by API tests',
      totalPackages: 5,
      items: [expect.objectContaining({ packageCount: 5, units: 500 })],
    });
  });

  test('GET /api/packing-lists filters by platform', async () => {
    const response = await packingLists.list({
      platformId: catalog.platform.id,
    });

    expect(response.status()).toBe(200);
    const body: PackingListSummary[] = await response.json();
    expect(body.map((l) => l.id)).toEqual([list.id]);
  });

  test('GET /api/packing-lists/{id} returns the list', async () => {
    const response = await packingLists.get(list.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toHaveProperty('id', list.id);
  });

  test('DELETE /api/packing-lists/{id} deletes the list', async () => {
    const response = await packingLists.delete(list.id);

    expect(response.status()).toBe(204);
    expect((await packingLists.get(list.id)).status()).toBe(404);
    expect(await reservationFor(catalog.product.id)).toBeUndefined();
  });
});

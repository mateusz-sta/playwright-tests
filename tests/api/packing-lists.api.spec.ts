import { PackingListsApi } from '../../api/PackingListsApi';
import {
  PackingList,
  PackingListSummary,
  Product,
  ProductReservation,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { today } from '../../test-data/factories';

async function reservationFor(
  packingListsApi: PackingListsApi,
  product: Product,
): Promise<ProductReservation | undefined> {
  const body: ProductReservation[] = await (
    await packingListsApi.reservations()
  ).json();
  expect(body).toMatchSchema('ProductReservationDto[]');
  return body.find((r) => r.productId === product.id);
}

// Packages from testData have 100 pcs.
// Packing lists and shipments exist only for Amazon platforms.
test.describe('API: packing lists', () => {
  test('POST /api/packing-lists creates a list', async ({
    packingListsApi,
    testData,
  }) => {
    const { platform, pkg } = await testData.catalog({ kind: 'AMAZON' });
    const name = testData.name('list');

    const response = await packingListsApi.create({
      platformId: platform.id,
      name,
      date: today(),
      items: [{ packageId: pkg.id, packageCount: 2 }],
    });

    expect(response.status()).toBe(201);
    const list: PackingList = await response.json();
    expect(list).toMatchSchema('PackingListDto');
    expect(list).toMatchObject({
      platformId: platform.id,
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

  test('GET /api/packing-lists/reservations counts units of items in progress', async ({
    packingListsApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog({ kind: 'AMAZON' });
    await testData.packingList(pkg, 2);

    expect(await reservationFor(packingListsApi, product)).toEqual({
      productId: product.id,
      units: 200,
    });
  });

  test('PATCH /api/packing-lists/{id}/items/{itemId} marks an item as done', async ({
    packingListsApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog({ kind: 'AMAZON' });
    const list = await testData.packingList(pkg, 2);

    const response = await packingListsApi.updateItemStatus(
      list.id,
      list.items[0].id,
      { status: 'DONE' },
    );

    expect(response.status()).toBe(200);
    const body: PackingList = await response.json();
    expect(body).toMatchSchema('PackingListDto');
    expect(body.doneCount).toBe(1);
    expect(body.items[0].status).toBe('DONE');
    // Done items are no longer reserved.
    expect(await reservationFor(packingListsApi, product)).toBeUndefined();
  });

  test('PATCH /api/packing-lists/{id}/items changes many items at once', async ({
    packingListsApi,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog({
      kind: 'AMAZON',
    });
    const second = await testData.package(platform, product);
    const list = await testData.packingList([pkg, second], 2);

    const response = await packingListsApi.updateItemsStatus(list.id, {
      itemIds: list.items.map((i) => i.id),
      status: 'DONE',
    });

    expect(response.status()).toBe(200);
    const body: PackingList = await response.json();
    expect(body).toMatchSchema('PackingListDto');
    expect(body.doneCount).toBe(2);
    expect(body.items.map((i) => i.status)).toEqual(['DONE', 'DONE']);
  });

  test('PUT /api/packing-lists/{id} replaces items', async ({
    packingListsApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });
    const list = await testData.packingList(pkg, 2);

    const response = await packingListsApi.replace(list.id, {
      note: 'Updated by API tests',
      items: [{ packageId: pkg.id, packageCount: 5 }],
    });

    expect(response.status()).toBe(200);
    expect<unknown>(await response.json()).toMatchSchema('PackingListDto');
    await expect(response.json()).resolves.toMatchObject({
      note: 'Updated by API tests',
      totalPackages: 5,
      items: [expect.objectContaining({ packageCount: 5, units: 500 })],
    });
  });

  test('GET /api/packing-lists filters by platform', async ({
    packingListsApi,
    testData,
  }) => {
    const { platform, pkg } = await testData.catalog({ kind: 'AMAZON' });
    const list = await testData.packingList(pkg, 2);

    const response = await packingListsApi.list({ platformId: platform.id });

    expect(response.status()).toBe(200);
    const body: PackingListSummary[] = await response.json();
    expect(body).toMatchSchema('PackingListSummaryDto[]');
    expect(body.map((l) => l.id)).toEqual([list.id]);
  });

  test('GET /api/packing-lists/{id} returns the list', async ({
    packingListsApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });
    const list = await testData.packingList(pkg, 2);

    const response = await packingListsApi.get(list.id);

    expect(response.status()).toBe(200);
    const body: PackingList = await response.json();
    expect(body).toMatchSchema('PackingListDto');
    expect(body).toEqual(list);
  });

  test('DELETE /api/packing-lists/{id} deletes the list', async ({
    packingListsApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog({ kind: 'AMAZON' });
    const list = await testData.packingList(pkg, 2);

    const response = await packingListsApi.delete(list.id);

    expect(response.status()).toBe(204);
    expect((await packingListsApi.get(list.id)).status()).toBe(404);
    expect(await reservationFor(packingListsApi, product)).toBeUndefined();
  });

  test('POST /api/packing-lists rejects a platform that is not Amazon', async ({
    packingListsApi,
    testData,
  }) => {
    const { platform, pkg } = await testData.catalog({ kind: 'OTHER' });

    const response = await packingListsApi.create({
      platformId: platform.id,
      name: testData.name('invalid'),
      date: today(),
      items: [{ packageId: pkg.id, packageCount: 1 }],
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      'message',
      'Listy pakowania są tylko dla platform typu Amazon',
    );
  });
});

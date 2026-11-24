import { Shipment, ShipmentSummary } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { today } from '../../test-data/factories';

// Packages from testData: 100 pcs, 450 g. Stock: 500 pcs = 5 packages.
// Packing lists and shipments exist only for Amazon platforms.
test.describe('API: shipments', () => {
  test('POST /api/shipments creates a shipment and issues its packages', async ({
    shipmentsApi,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: 500,
    });
    const name = testData.shipmentName();

    const response = await shipmentsApi.create({
      platformId: platform.id,
      name,
      date: today(),
      boxes: [
        {
          lengthCm: 60,
          widthCm: 40,
          heightCm: 40,
          weightKg: 1.5,
          items: [{ packageId: pkg.id, packageCount: 2 }],
        },
      ],
    });

    expect(response.status()).toBe(201);
    const shipment: Shipment = await response.json();
    expect(shipment).toMatchSchema('ShipmentDto');
    expect(shipment).toMatchObject({
      platformId: platform.id,
      name,
      documentId: expect.any(Number),
      boxCount: 1,
      totalPackages: 2,
      boxes: [
        {
          position: 1,
          label: `${name}-1`,
          weightKg: 1.5,
          contentWeightG: 900,
          itemsWithoutWeight: 0,
          totalPackages: 2,
          items: [
            expect.objectContaining({
              packageId: pkg.id,
              packageCount: 2,
              units: 200,
            }),
          ],
        },
      ],
    });
    expect(await testData.stockOf(product)).toBe(300);
  });

  test('the shipment creates an issue (OUT) document', async ({
    documentsApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON', stock: 500 });
    const shipment = await testData.shipment(pkg, 2);

    const response = await documentsApi.get(shipment.documentId as number);

    expect(response.status()).toBe(200);
    expect<unknown>(await response.json()).toMatchSchema('DocumentDto');
    await expect(response.json()).resolves.toMatchObject({
      type: 'OUT',
      shipmentId: shipment.id,
      totalQuantity: 200,
    });
  });

  test('GET /api/shipments filters by platform', async ({
    shipmentsApi,
    testData,
  }) => {
    const { platform, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: 500,
    });
    const shipment = await testData.shipment(pkg, 2);

    const response = await shipmentsApi.list({ platformId: platform.id });

    expect(response.status()).toBe(200);
    const body: ShipmentSummary[] = await response.json();
    expect(body).toMatchSchema('ShipmentSummaryDto[]');
    expect(body.map((s) => s.id)).toEqual([shipment.id]);
  });

  test('GET /api/shipments/{id} returns the shipment with boxes', async ({
    shipmentsApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON', stock: 500 });
    const shipment = await testData.shipment(pkg, 2);

    const response = await shipmentsApi.get(shipment.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(shipment);
  });

  test('PUT /api/shipments/{id} replaces boxes and recalculates the issue', async ({
    shipmentsApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: 500,
    });
    const shipment = await testData.shipment(pkg, 2);

    const response = await shipmentsApi.replace(shipment.id, {
      boxes: [
        { items: [{ packageId: pkg.id, packageCount: 1 }] },
        { items: [{ packageId: pkg.id, packageCount: 2 }] },
      ],
    });

    expect(response.status()).toBe(200);
    expect<unknown>(await response.json()).toMatchSchema('ShipmentDto');
    await expect(response.json()).resolves.toMatchObject({
      boxCount: 2,
      totalPackages: 3,
    });
    expect(await testData.stockOf(product)).toBe(200);
  });

  test('DELETE /api/shipments/{id} deletes the shipment and returns the stock', async ({
    documentsApi,
    shipmentsApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: 500,
    });
    const shipment = await testData.shipment(pkg, 2);
    expect(await testData.stockOf(product)).toBe(300);

    const response = await shipmentsApi.delete(shipment.id);

    expect(response.status()).toBe(204);
    expect((await shipmentsApi.get(shipment.id)).status()).toBe(404);
    const issue = await documentsApi.get(shipment.documentId as number);
    expect(issue.status()).toBe(404);
    expect(await testData.stockOf(product)).toBe(500);
  });

  test('POST /api/shipments rejects a platform that is not Amazon', async ({
    shipmentsApi,
    testData,
  }) => {
    const { platform, pkg } = await testData.catalog({ kind: 'OTHER' });

    const response = await shipmentsApi.create({
      platformId: platform.id,
      name: testData.shipmentName(),
      date: today(),
      boxes: [{ items: [{ packageId: pkg.id, packageCount: 1 }] }],
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      'message',
      'Wysyłki są tylko dla platform typu Amazon (FBA)',
    );
  });
});

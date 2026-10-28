import { DocumentsApi } from '../../api/DocumentsApi';
import { ProductsApi } from '../../api/ProductsApi';
import { ShipmentsApi } from '../../api/ShipmentsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import {
  Document,
  Package,
  Product,
  Shipment,
  ShipmentSummary,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
  readCreated,
} from '../../test-data/catalog';
import { today, uniqueId } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let shipments: ShipmentsApi;
let documents: DocumentsApi;
let products: ProductsApi;
let catalog: Catalog;
let pkg: Package;
let receipt: Document;
let shipment: Shipment;

async function productStock(): Promise<number> {
  const product: Product = await (
    await products.get(catalog.product.id)
  ).json();
  return product.stock;
}

test.describe.configure({ mode: 'serial' });

test.describe('API: shipments', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    shipments = new ShipmentsApi(api);
    documents = new DocumentsApi(api);
    products = new ProductsApi(api);
    // Package = 100 pcs, 450 g. Stock: 500 pcs = 5 packages.
    catalog = await createCatalog(api, { withPackage: true });
    pkg = catalog.pkg as Package;
    receipt = await readCreated<Document>(
      await documents.create({
        type: 'IN',
        date: today(),
        lines: [{ productId: catalog.product.id, quantity: 500 }],
      }),
      'receipt',
    );
  });

  test.afterAll(async () => {
    if (shipment)
      await deleteIgnoringMissing(await shipments.delete(shipment.id));
    await deleteIgnoringMissing(await documents.delete(receipt.id));
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('POST /api/shipments creates a shipment and issues its packages', async () => {
    // Shipment names are short labels, e.g. R158.
    const name = `PW${uniqueId().slice(-8)}`;

    const response = await shipments.create({
      platformId: catalog.platform.id,
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
    shipment = await response.json();
    expect(shipment).toMatchObject({
      platformId: catalog.platform.id,
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
    expect(await productStock()).toBe(300);
  });

  test('the shipment creates an issue (OUT) document', async () => {
    const response = await documents.get(shipment.documentId as number);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      type: 'OUT',
      shipmentId: shipment.id,
      totalQuantity: 200,
    });
  });

  test('GET /api/shipments filters by platform', async () => {
    const response = await shipments.list({ platformId: catalog.platform.id });

    expect(response.status()).toBe(200);
    const body: ShipmentSummary[] = await response.json();
    expect(body.map((s) => s.id)).toEqual([shipment.id]);
  });

  test('GET /api/shipments/{id} returns the shipment with boxes', async () => {
    const response = await shipments.get(shipment.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(shipment);
  });

  test('PUT /api/shipments/{id} replaces boxes and recalculates the issue', async () => {
    const response = await shipments.replace(shipment.id, {
      boxes: [
        { items: [{ packageId: pkg.id, packageCount: 1 }] },
        { items: [{ packageId: pkg.id, packageCount: 2 }] },
      ],
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      boxCount: 2,
      totalPackages: 3,
    });
    expect(await productStock()).toBe(200);
  });

  test('DELETE /api/shipments/{id} deletes the shipment and returns the stock', async () => {
    const response = await shipments.delete(shipment.id);

    expect(response.status()).toBe(204);
    expect((await shipments.get(shipment.id)).status()).toBe(404);
    expect((await documents.get(shipment.documentId as number)).status()).toBe(
      404,
    );
    expect(await productStock()).toBe(500);
  });
});

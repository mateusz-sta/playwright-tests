import { DocumentsApi } from '../../api/DocumentsApi';
import { PackingListsApi } from '../../api/PackingListsApi';
import { ProductsApi } from '../../api/ProductsApi';
import { ShipmentsApi } from '../../api/ShipmentsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Package, Product } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
  readCreated,
} from '../../test-data/catalog';
import { TEST_PREFIX, today, uniqueId } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let products: ProductsApi;
let packingLists: PackingListsApi;
let shipments: ShipmentsApi;
let documents: DocumentsApi;
// Amazon platform, package of 100 pcs (450 g), stock 500 pcs
let catalog: Catalog;
let pkg: Package;
let receiptId: number;

async function stock(): Promise<number> {
  const product: Product = await (
    await products.get(catalog.product.id)
  ).json();
  return product.stock;
}

test.describe('Packing lists and shipments', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    products = new ProductsApi(api);
    packingLists = new PackingListsApi(api);
    shipments = new ShipmentsApi(api);
    documents = new DocumentsApi(api);
    catalog = await createCatalog(api, { withPackage: true, kind: 'AMAZON' });
    pkg = catalog.pkg as Package;
    receiptId = (
      await readCreated<{ id: number }>(
        await documents.create({
          type: 'IN',
          date: today(),
          lines: [{ productId: catalog.product.id, quantity: 500 }],
        }),
        'receipt',
      )
    ).id;
  });

  test.afterAll(async () => {
    if (!api) return;
    const platformId = catalog?.platform.id;
    if (platformId) {
      for (const s of await (await shipments.list({ platformId })).json()) {
        await deleteIgnoringMissing(await shipments.delete(s.id));
      }
      for (const l of await (await packingLists.list({ platformId })).json()) {
        await deleteIgnoringMissing(await packingLists.delete(l.id));
      }
    }
    if (receiptId) {
      await deleteIgnoringMissing(await documents.delete(receiptId));
    }
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('user plans a packing list and marks the item as done', async ({
    packingListFormPage,
    packingListDetailsPage,
  }) => {
    const name = `${TEST_PREFIX} list ${uniqueId()}`;
    await packingListFormPage.forPlatform(catalog.platform.id).open();
    await packingListFormPage.setName(name);

    await packingListFormPage.addPackage(pkg.sku, 2);
    await packingListFormPage.expectLine(pkg.sku, '200 szt.', '500 szt.');
    await packingListFormPage.expectSummary(
      'Pozycje: 1 · paczki: 2 · sztuki produktów: 200',
    );
    await packingListFormPage.save();

    await packingListDetailsPage.rememberIdFromUrl();
    await packingListDetailsPage.expectName(name);
    await packingListDetailsPage.expectTotal('2 paczek · 200 szt. produktów');
    await packingListDetailsPage.expectProgress(0, 1);
    await packingListDetailsPage.expectItemStatus(pkg.sku, 'W trakcie');

    await packingListDetailsPage.toggleItem(pkg.sku);

    await packingListDetailsPage.expectItemStatus(pkg.sku, 'Gotowe');
    await packingListDetailsPage.expectListDone();
    // A packing list never changes stock.
    expect(await stock()).toBe(500);
  });

  test('user ships packages in two boxes; deleting the shipment returns the stock', async ({
    shipmentFormPage,
    shipmentDetailsPage,
  }) => {
    // Shipment names are short labels, boxes get "<name>-1", "<name>-2"…
    const name = `PW${uniqueId().slice(-6)}`;
    await shipmentFormPage.forPlatform(catalog.platform.id).open();
    await shipmentFormPage.setName(name);

    await shipmentFormPage.addPackage(pkg.sku, 1);
    await shipmentFormPage.addBox();
    await shipmentFormPage.addPackage(pkg.sku, 2);
    await shipmentFormPage.expectInBox(`${name}-1`, pkg.sku, 1);
    await shipmentFormPage.expectInBox(`${name}-2`, pkg.sku, 2);
    await shipmentFormPage.expectSummary('Pudełka: 2 · pakiety: 3 · ~1,4 kg');
    await shipmentFormPage.save();

    await shipmentDetailsPage.rememberIdFromUrl();
    await shipmentDetailsPage.expectShipment(name, {
      boxes: 2,
      packages: 3,
      units: '300 szt.',
    });
    expect(await stock()).toBe(200);

    await shipmentDetailsPage.delete();

    await expect.poll(stock).toBe(500);
  });
});

import { DocumentsApi } from '../../api/DocumentsApi';
import { ProductsApi } from '../../api/ProductsApi';
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
import { today } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let documents: DocumentsApi;
let products: ProductsApi;
// Platform OTHER, product, package of 100 pcs
let catalog: Catalog;
let pkg: Package;
const documentIds: number[] = [];

async function stock(): Promise<number> {
  const product: Product = await (
    await products.get(catalog.product.id)
  ).json();
  return product.stock;
}

test.describe('Stock documents', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    documents = new DocumentsApi(api);
    products = new ProductsApi(api);
    catalog = await createCatalog(api, { withPackage: true });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    if (!api) return;
    // Issues before receipts, so stock never stays negative.
    for (const id of documentIds.reverse()) {
      await deleteIgnoringMissing(await documents.delete(id));
    }
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test.describe.configure({ mode: 'serial' });

  test('receipt adds stock and shows in the product history; deleting it reverts the stock', async ({
    receiptFormPage,
    documentDetailsPage,
    productDetailsPage,
  }) => {
    const symbol = catalog.product.symbol;
    await receiptFormPage.open();

    await receiptFormPage.addProduct(symbol, 250);
    await receiptFormPage.expectSummary('Razem: 1 poz. · 250 szt.');
    await receiptFormPage.submit();

    const id = await documentDetailsPage.rememberIdFromUrl();
    documentIds.push(id);
    await documentDetailsPage.expectDocument('Przyjęcie', 1);
    await documentDetailsPage.expectLine(symbol, '250 szt.');

    await productDetailsPage.forProduct(catalog.product.id).open();
    await productDetailsPage.expectStock('250 szt.');
    await productDetailsPage.expectHistoryEntry('Przyjęcie +250 szt.');

    await documentDetailsPage.open();
    await documentDetailsPage.delete();
    await expect.poll(stock).toBe(0);
  });

  test('issue of packages lowers the stock and the package availability', async ({
    issueFormPage,
    documentDetailsPage,
    packagesListPage,
  }) => {
    documentIds.push(
      (
        await readCreated<{ id: number }>(
          await documents.create({
            type: 'IN',
            date: today(),
            lines: [{ productId: catalog.product.id, quantity: 500 }],
          }),
          'receipt',
        )
      ).id,
    );
    await issueFormPage.open();

    await issueFormPage.selectPlatform(catalog.platform.name);
    await issueFormPage.addPackage(pkg.sku, 2);
    await issueFormPage.submit();

    documentIds.push(await documentDetailsPage.rememberIdFromUrl());
    await documentDetailsPage.expectDocument('Wydanie', 1);
    // Issue lines show the package SKU and "packages = pieces".
    await documentDetailsPage.expectLine(pkg.sku, '2 pak. = 200 szt.');
    expect(await stock()).toBe(300);

    await packagesListPage.forPlatform(catalog.platform.id).open();
    await packagesListPage.search(pkg.sku);
    await packagesListPage.expectRow(pkg.sku, ['3 pak.']);
  });
});

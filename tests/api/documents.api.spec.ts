import { DocumentsApi } from '../../api/DocumentsApi';
import { PackagesApi } from '../../api/PackagesApi';
import { ProductsApi } from '../../api/ProductsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import {
  Document,
  DocumentSummary,
  Package,
  Product,
  StockMovement,
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
let documents: DocumentsApi;
let products: ProductsApi;
let catalog: Catalog;
let pkg: Package;
const createdDocumentIds: number[] = [];

async function productStock(): Promise<number> {
  const product: Product = await (
    await products.get(catalog.product.id)
  ).json();
  return product.stock;
}

test.describe('API: documents (stock receipts and issues)', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    documents = new DocumentsApi(api);
    products = new ProductsApi(api);
    // Package = 100 pcs of the product.
    catalog = await createCatalog(api, { withPackage: true });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    // Issues first, then receipts – this puts the stock back to 0.
    for (const id of createdDocumentIds.filter(Boolean).reverse()) {
      await deleteIgnoringMissing(await documents.delete(id));
    }
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test.describe('receipt and issue flow', () => {
    test.describe.configure({ mode: 'serial' });

    let receipt: Document;
    let issue: Document;

    test('POST /api/documents (IN) adds stock', async () => {
      const reference = `${TEST_PREFIX} FV ${uniqueId()}`;

      const response = await documents.create({
        type: 'IN',
        date: today(),
        reference,
        counterparty: 'Supplier',
        lines: [{ productId: catalog.product.id, quantity: 500 }],
      });

      expect(response.status()).toBe(201);
      receipt = await response.json();
      createdDocumentIds.push(receipt.id);
      expect(receipt).toMatchObject({
        type: 'IN',
        reference,
        lineCount: 1,
        totalQuantity: 500,
        lines: [
          {
            productId: catalog.product.id,
            productSymbol: catalog.product.symbol,
            quantity: 500,
          },
        ],
      });
      expect(await productStock()).toBe(500);
      const updatedPackage: Package = await (
        await new PackagesApi(api).get(pkg.id)
      ).json();
      expect(updatedPackage.available).toBe(5);
    });

    test('POST /api/documents (OUT) issues packages and lowers stock', async () => {
      const response = await documents.create({
        type: 'OUT',
        platformId: catalog.platform.id,
        date: today(),
        lines: [{ packageId: pkg.id, quantity: 2 }],
      });

      expect(response.status()).toBe(201);
      issue = await response.json();
      createdDocumentIds.push(issue.id);
      expect(issue).toMatchObject({
        type: 'OUT',
        platformId: catalog.platform.id,
        totalQuantity: 200,
        lines: [{ packageId: pkg.id, packageCount: 2, quantity: 200 }],
      });
      expect(await productStock()).toBe(300);
    });

    test('GET /api/products/{id}/movements shows both movements', async () => {
      const response = await products.movements(catalog.product.id);

      expect(response.status()).toBe(200);
      const body: StockMovement[] = await response.json();
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            documentId: receipt.id,
            type: 'IN',
            quantity: 500,
          }),
          expect.objectContaining({
            documentId: issue.id,
            type: 'OUT',
            quantity: 200,
          }),
        ]),
      );
    });

    test('GET /api/documents filters by type and platform', async () => {
      const response = await documents.list({
        type: 'OUT',
        platformId: catalog.platform.id,
      });

      expect(response.status()).toBe(200);
      const body: DocumentSummary[] = await response.json();
      expect(body.map((d) => d.id)).toEqual([issue.id]);
    });

    test('GET /api/documents/{id} returns the document with lines', async () => {
      const response = await documents.get(receipt.id);

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual(receipt);
    });

    test('DELETE /api/documents/{id} reverts the stock movement', async () => {
      const response = await documents.delete(issue.id);

      expect(response.status()).toBe(204);
      expect(await productStock()).toBe(500);
      expect((await documents.get(issue.id)).status()).toBe(404);
    });
  });

  test.describe('validation', () => {
    test('receipt (IN) cannot have a platform', async () => {
      const response = await documents.create({
        type: 'IN',
        platformId: catalog.platform.id,
        date: today(),
        lines: [{ productId: catalog.product.id, quantity: 1 }],
      });

      expect(response.status()).toBe(400);
    });

    test('issue (OUT) requires a platform', async () => {
      const response = await documents.create({
        type: 'OUT',
        date: today(),
        lines: [{ packageId: pkg.id, quantity: 1 }],
      });

      expect(response.status()).toBe(400);
    });

    // Intended business rule: an issue may exceed the recorded stock (it reflects the real
    // warehouse state), so the stock can go negative.
    test('issue (OUT) may exceed the stock, which then goes negative', async () => {
      const stockBefore = await productStock();

      const response = await documents.create({
        type: 'OUT',
        platformId: catalog.platform.id,
        date: today(),
        lines: [{ packageId: pkg.id, quantity: 10_000 }],
      });

      expect(response.status()).toBe(201);
      const body: Document = await response.json();
      createdDocumentIds.push(body.id);
      // 10 000 packages × 100 pcs
      expect(body.totalQuantity).toBe(1_000_000);
      expect(await productStock()).toBe(stockBefore - 1_000_000);
      expect(await productStock()).toBeLessThan(0);
    });
  });
});

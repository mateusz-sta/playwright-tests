import {
  Document,
  DocumentSummary,
  Package,
  StockMovement,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { today } from '../../test-data/factories';

// Packages from testData have 100 pcs.
test.describe('API: documents (stock receipts and issues)', () => {
  test.describe('receipt and issue flow', () => {
    test('POST /api/documents (IN) adds stock', async ({
      documentsApi,
      packagesApi,
      testData,
    }) => {
      const { product, pkg } = await testData.catalog();
      const reference = testData.name('FV');

      const response = await documentsApi.create({
        type: 'IN',
        date: today(),
        reference,
        counterparty: 'Supplier',
        lines: [{ productId: product.id, quantity: 500 }],
      });

      expect(response.status()).toBe(201);
      const receipt: Document = await response.json();
      expect(receipt).toMatchSchema('DocumentDto');
      expect(receipt).toMatchObject({
        type: 'IN',
        reference,
        lineCount: 1,
        totalQuantity: 500,
        lines: [
          {
            productId: product.id,
            productSymbol: product.symbol,
            quantity: 500,
          },
        ],
      });
      expect(await testData.stockOf(product)).toBe(500);
      const updatedPackage: Package = await (
        await packagesApi.get(pkg.id)
      ).json();
      expect(updatedPackage.available).toBe(5);
    });

    test('POST /api/documents (OUT) issues packages and lowers stock', async ({
      documentsApi,
      testData,
    }) => {
      const { platform, product, pkg } = await testData.catalog({ stock: 500 });

      const response = await documentsApi.create({
        type: 'OUT',
        platformId: platform.id,
        date: today(),
        lines: [{ packageId: pkg.id, quantity: 2 }],
      });

      expect(response.status()).toBe(201);
      const issue: Document = await response.json();
      expect(issue).toMatchSchema('DocumentDto');
      expect(issue).toMatchObject({
        type: 'OUT',
        platformId: platform.id,
        totalQuantity: 200,
        lines: [{ packageId: pkg.id, packageCount: 2, quantity: 200 }],
      });
      expect(await testData.stockOf(product)).toBe(300);
    });

    test('GET /api/products/{id}/movements shows both movements', async ({
      productsApi,
      testData,
    }) => {
      const { product, pkg } = await testData.catalog();
      const receipt = await testData.receipt(product, 500);
      const issue = await testData.issue(pkg, 2);

      const response = await productsApi.movements(product.id);

      expect(response.status()).toBe(200);
      const body: StockMovement[] = await response.json();
      expect(body).toMatchSchema('StockMovementDto[]');
      expect(body).toHaveLength(2);
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

    test('GET /api/documents filters by type and platform', async ({
      documentsApi,
      testData,
    }) => {
      const { platform, pkg } = await testData.catalog({ stock: 500 });
      const issue = await testData.issue(pkg, 2);

      const response = await documentsApi.list({
        type: 'OUT',
        platformId: platform.id,
      });

      expect(response.status()).toBe(200);
      const body: DocumentSummary[] = await response.json();
      expect(body).toMatchSchema('DocumentSummaryDto[]');
      expect(body.map((d) => d.id)).toEqual([issue.id]);
    });

    test('GET /api/documents/{id} returns the document with lines', async ({
      documentsApi,
      testData,
    }) => {
      const receipt = await testData.receipt(await testData.product(), 500);

      const response = await documentsApi.get(receipt.id);

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual(receipt);
    });

    test('DELETE /api/documents/{id} reverts the stock movement', async ({
      documentsApi,
      testData,
    }) => {
      const { product, pkg } = await testData.catalog({ stock: 500 });
      const issue = await testData.issue(pkg, 2);
      expect(await testData.stockOf(product)).toBe(300);

      const response = await documentsApi.delete(issue.id);

      expect(response.status()).toBe(204);
      expect(await testData.stockOf(product)).toBe(500);
      expect((await documentsApi.get(issue.id)).status()).toBe(404);
    });
  });

  test.describe('validation', () => {
    test('receipt (IN) cannot have a platform', async ({
      documentsApi,
      testData,
    }) => {
      const { platform, product } = await testData.catalog();

      const response = await documentsApi.create({
        type: 'IN',
        platformId: platform.id,
        date: today(),
        lines: [{ productId: product.id, quantity: 1 }],
      });

      expect(response.status()).toBe(400);
    });

    test('issue (OUT) requires a platform', async ({
      documentsApi,
      testData,
    }) => {
      const { pkg } = await testData.catalog();

      const response = await documentsApi.create({
        type: 'OUT',
        date: today(),
        lines: [{ packageId: pkg.id, quantity: 1 }],
      });

      expect(response.status()).toBe(400);
    });

    // Intended business rule: an issue may exceed the recorded stock (it reflects the real
    // warehouse state), so the stock can go negative.
    test('issue (OUT) may exceed the stock, which then goes negative', async ({
      documentsApi,
      testData,
    }) => {
      const { platform, product, pkg } = await testData.catalog({ stock: 500 });

      const response = await documentsApi.create({
        type: 'OUT',
        platformId: platform.id,
        date: today(),
        lines: [{ packageId: pkg.id, quantity: 10_000 }],
      });

      expect(response.status()).toBe(201);
      const body: Document = await response.json();
      expect(body).toMatchSchema('DocumentDto');
      // 10 000 packages × 100 pcs
      expect(body.totalQuantity).toBe(1_000_000);
      expect(await testData.stockOf(product)).toBe(500 - 1_000_000);
    });
  });
});

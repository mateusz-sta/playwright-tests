import { expect, test } from '../../fixtures/fixtures';
import {
  STOCK,
  issuedPackages,
  pak,
  pcs,
  receiptSummary,
} from '../../test-data/ui';

test.describe('Stock documents', () => {
  test('receipt adds stock and shows in the product history; deleting it reverts the stock', async ({
    receiptFormPage,
    documentSteps,
    documentDetailsPage,
    productDetailsPage,
    testData,
  }) => {
    const product = await testData.product();

    await receiptFormPage.open();
    await receiptFormPage.addProduct(product.symbol, STOCK.received);
    await receiptFormPage.expectSummary(receiptSummary(1, STOCK.received));
    await receiptFormPage.submit();

    await documentDetailsPage.rememberIdFromUrl();
    await documentDetailsPage.expectDocument('Przyjęcie', 1);
    await documentDetailsPage.expectLine(product.symbol, pcs(STOCK.received));

    await productDetailsPage.forProduct(product.id).open();
    await productDetailsPage.expectStock(pcs(STOCK.received));
    await productDetailsPage.expectHistoryEntry(
      `Przyjęcie +${pcs(STOCK.received)}`,
    );

    await documentSteps.deleteOpenedDocument();

    await expect.poll(() => testData.stockOf(product)).toBe(0);
  });

  test('issue of packages lowers the stock and the package availability', async ({
    documentSteps,
    documentDetailsPage,
    packageSteps,
    packagesListPage,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog({
      stock: STOCK.initial,
    });
    const issuedUnits = STOCK.packagesIssued * STOCK.unitsPerPackage;
    const left = STOCK.initial - issuedUnits;

    await documentSteps.issue(platform.name, pkg.sku, STOCK.packagesIssued);

    await documentDetailsPage.expectDocument('Wydanie', 1);
    // Issue lines show the package SKU and "packages = pieces".
    await documentDetailsPage.expectLine(
      pkg.sku,
      issuedPackages(STOCK.packagesIssued, issuedUnits),
    );
    expect(await testData.stockOf(product)).toBe(left);

    await packageSteps.searchList(platform.id, pkg.sku);

    await packagesListPage.expectRow(pkg.sku, [
      pak(left / STOCK.unitsPerPackage),
    ]);
  });
});

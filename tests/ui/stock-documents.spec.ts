import { expect, test } from '../../fixtures/fixtures';
import {
  STOCK,
  issuedPackages,
  pak,
  pcs,
  receiptHistoryEntry,
  receiptSummary,
} from '../../test-data/ui';
import { DOCUMENT_TYPE } from '../../utils/appTexts';

test.describe('Stock documents', () => {
  test('receipt adds stock and shows in the product history; deleting it reverts the stock', async ({
    receiptFormPage,
    documentSteps,
    documentDetailsPage,
    productDetailsPage,
    testData,
  }) => {
    const product = await testData.product();

    await documentSteps.fillReceipt(product.symbol, STOCK.received);
    await receiptFormPage.expectSummary(receiptSummary(1, STOCK.received));
    await documentSteps.submitReceipt();

    await documentDetailsPage.expectDocument(DOCUMENT_TYPE.receipt, 1);
    await documentDetailsPage.expectLine(product.symbol, pcs(STOCK.received));

    await productDetailsPage.forProduct(product.id).open();
    await productDetailsPage.expectStock(pcs(STOCK.received));
    await productDetailsPage.expectHistoryEntry(
      receiptHistoryEntry(STOCK.received),
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

    await documentDetailsPage.expectDocument(DOCUMENT_TYPE.issue, 1);
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

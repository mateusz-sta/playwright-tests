import { test } from '../../fixtures/fixtures';
import { AMAZON_PACKAGE, pak } from '../../test-data/ui';

test.describe('Packages', () => {
  test('package form suggests name and SKU and enables the code after choosing its type', async ({
    packageFormPage,
    testData,
  }) => {
    const platform = await testData.platform('AMAZON');
    const product = await testData.product();
    await packageFormPage.forPlatform(platform.id).open();
    await packageFormPage.expectCodeInputDisabledUntilTypeChosen();

    await packageFormPage.fillForm({
      product: product.symbol,
      quantity: AMAZON_PACKAGE.quantity,
    });

    await packageFormPage.expectSuggestedNameAndSku(
      `${product.name} – ${AMAZON_PACKAGE.quantity} szt.`,
      `${product.symbol}-${AMAZON_PACKAGE.quantity}`,
    );
  });

  test('user adds an Amazon package and finds it on the list', async ({
    packageSteps,
    packagesListPage,
    testData,
  }) => {
    const platform = await testData.platform('AMAZON');
    const product = await testData.product();
    const sku = `${product.symbol}-${AMAZON_PACKAGE.quantity}`;

    await packageSteps.addPackage(platform.id, {
      product: product.symbol,
      quantity: AMAZON_PACKAGE.quantity,
      weightG: AMAZON_PACKAGE.weightG,
      asin: AMAZON_PACKAGE.asin,
      fnsku: AMAZON_PACKAGE.fnsku,
      codeType: 'EAN',
      code: AMAZON_PACKAGE.ean,
    });
    await packageSteps.searchList(platform.id, sku);

    await packagesListPage.expectRow(sku, [
      AMAZON_PACKAGE.asin,
      AMAZON_PACKAGE.fnsku,
      AMAZON_PACKAGE.ean,
      `${AMAZON_PACKAGE.weightG} g`,
      pak(0),
    ]);
  });

  test('a package with available stock cannot be deleted', async ({
    packageSteps,
    packageFormPage,
    testData,
  }) => {
    const { platform, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: AMAZON_PACKAGE.stockForTwoPackages,
    });

    await packageSteps.openEditForm(platform.id, pkg.id);

    await packageFormPage.expectDeleteBlocked(2);
  });
});

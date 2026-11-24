import { test } from '../../fixtures/fixtures';
import {
  AMAZON_PACKAGE,
  AVAILABLE_PACKAGES,
  grams,
  pak,
  suggestedPackageName,
  suggestedSku,
} from '../../test-data/ui';

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
      suggestedPackageName(product.name, AMAZON_PACKAGE.quantity),
      suggestedSku(product.symbol, AMAZON_PACKAGE.quantity),
    );
  });

  test('user adds an Amazon package and finds it on the list', async ({
    packageSteps,
    packagesListPage,
    testData,
  }) => {
    const platform = await testData.platform('AMAZON');
    const product = await testData.product();
    const sku = suggestedSku(product.symbol, AMAZON_PACKAGE.quantity);

    await packageSteps.addPackage(platform.id, {
      product: product.symbol,
      quantity: AMAZON_PACKAGE.quantity,
      weightG: AMAZON_PACKAGE.weightG,
      asin: AMAZON_PACKAGE.asin,
      fnsku: AMAZON_PACKAGE.fnsku,
      codeType: AMAZON_PACKAGE.codeType,
      code: AMAZON_PACKAGE.code,
    });
    await packageSteps.searchList(platform.id, sku);

    await packagesListPage.expectRow(sku, [
      AMAZON_PACKAGE.asin,
      AMAZON_PACKAGE.fnsku,
      AMAZON_PACKAGE.code,
      grams(AMAZON_PACKAGE.weightG),
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
      stock: AVAILABLE_PACKAGES.stock,
    });

    await packageSteps.openEditForm(platform.id, pkg.id);

    await packageFormPage.expectDeleteBlocked(AVAILABLE_PACKAGES.count);
  });
});

import { expect, test } from '../../fixtures/fixtures';
import { MESSAGES, PRODUCT, PRODUCT_UPDATE, pcs } from '../../test-data/ui';

test.describe('Products', () => {
  test('product form calculates prices while typing', async ({
    productFormPage,
    testData,
  }) => {
    await productFormPage.forNewProduct().open();

    await productFormPage.fillForm({
      name: testData.name('product'),
      symbol: testData.symbol(),
      netPrice: PRODUCT.netPrice,
    });
    await productFormPage.expectCalculatedPrices(PRODUCT.prices);

    // Price per 1 pc is converted, calculated prices stay the same.
    await productFormPage.fillForm({ priceUnit: 'za 1 szt.' });
    await productFormPage.expectNetPrice(PRODUCT.netPricePerUnit);
    await productFormPage.expectCalculatedPrices(PRODUCT.prices);
  });

  test('user adds a product and finds it on the list', async ({
    productSteps,
    productDetailsPage,
    productsPage,
    testData,
  }) => {
    const name = testData.name('product');
    const symbol = testData.symbol();

    await productSteps.addProduct({ name, symbol, netPrice: PRODUCT.netPrice });

    await productDetailsPage.expectProduct(name, symbol);
    await productDetailsPage.expectStock(pcs(0));
    await productDetailsPage.expectPrices(PRODUCT.prices);

    await productSteps.searchList(symbol);

    await productsPage.expectResults(1);
    await productsPage.expectRow(symbol, [
      name,
      PRODUCT.prices.per1000Net,
      PRODUCT.prices.per1000Gross,
      pcs(0),
    ]);
  });

  test('user cannot add a product with a symbol that is already used', async ({
    productSteps,
    productFormPage,
    testData,
  }) => {
    const existing = await testData.product();

    await productSteps.submitNewProduct({
      name: testData.name('duplicate'),
      symbol: existing.symbol,
    });

    await productFormPage.expectError(MESSAGES.symbolTaken(existing.symbol));
    await productFormPage.expectToBeOpened();
  });

  test('user changes price and VAT, and prices are recalculated', async ({
    productSteps,
    productDetailsPage,
    testData,
  }) => {
    const product = await testData.product();

    await productSteps.editProduct(product.id, {
      netPrice: PRODUCT_UPDATE.netPrice,
      vatRate: PRODUCT_UPDATE.vatRate,
    });

    await productDetailsPage.expectPrices(PRODUCT_UPDATE.prices);
  });

  test('user deletes a product', async ({
    productSteps,
    productsPage,
    testData,
  }) => {
    const product = await testData.product();

    await productSteps.deleteProduct(product.id, product.name);

    await productsPage.expectToBeOpened();
    await expect.poll(() => testData.productExists(product)).toBe(false);
  });
});

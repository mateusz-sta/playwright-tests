import { ProductsApi } from '../../api/ProductsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Product } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { readCreated } from '../../test-data/catalog';
import { TEST_PREFIX, buildProduct, uniqueId } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

// 42.50 zł net per 1000 pcs, VAT 23%
const PRICES = {
  per1000Net: '42,50 zł',
  per1000Gross: '52,28 zł',
  unitNet: '0,0425 zł',
  unitGross: '0,05228 zł',
};

let api: APIRequestContext;
let products: ProductsApi;
const productIds: number[] = [];

async function createProduct(): Promise<Product> {
  const product = await readCreated<Product>(
    await products.create(buildProduct()),
    'product',
  );
  productIds.push(product.id);
  return product;
}

test.describe('Products', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    products = new ProductsApi(api);
  });

  test.afterAll(async () => {
    if (!api) return;
    await products.deleteBulk({ ids: productIds });
    await api.dispose();
  });

  test('user adds a product, sees calculated prices and finds it on the list', async ({
    productFormPage,
    productDetailsPage,
    productsPage,
  }) => {
    const name = `${TEST_PREFIX} UI product ${uniqueId()}`;
    const symbol = `${TEST_PREFIX}-${uniqueId()}`;
    await productFormPage.open();

    await productFormPage.fillForm({ name, symbol, netPrice: 42.5 });
    await productFormPage.expectCalculatedPrices(PRICES);

    // Price per 1 pc is converted, calculated prices stay the same.
    await productFormPage.fillForm({ priceUnit: 'za 1 szt.' });
    await productFormPage.expectNetPrice('0.0425');
    await productFormPage.expectCalculatedPrices(PRICES);

    await productFormPage.save();
    productIds.push(await productDetailsPage.rememberIdFromUrl());
    await productDetailsPage.expectProduct(name, symbol);
    await productDetailsPage.expectStock('0 szt.');
    await productDetailsPage.expectPrices(PRICES);

    await productsPage.open();
    await productsPage.search(symbol);
    await productsPage.expectResults(1);
    await productsPage.expectRow(symbol, [
      name,
      '42,50 zł',
      '52,28 zł',
      '0 szt.',
    ]);
  });

  test('user cannot add a product with a symbol that is already used', async ({
    productFormPage,
  }) => {
    const existing = await createProduct();
    await productFormPage.open();

    await productFormPage.fillForm({
      name: 'Duplicate',
      symbol: existing.symbol,
    });
    await productFormPage.save();

    await productFormPage.expectError(
      `Symbol ${existing.symbol} jest już zajęty`,
    );
    await productFormPage.expectToBeOpened();
  });

  test('user changes price and VAT, and prices are recalculated', async ({
    productFormPage,
    productDetailsPage,
  }) => {
    const product = await createProduct();
    await productFormPage.forProduct(product.id).open();

    await productFormPage.fillForm({ netPrice: 20, vatRate: '5%' });
    await productFormPage.save();

    await productDetailsPage.forProduct(product.id).expectToBeOpened();
    await productDetailsPage.expectPrices({
      per1000Net: '20,00 zł',
      per1000Gross: '21,00 zł',
      unitNet: '0,02 zł',
      unitGross: '0,021 zł',
    });
  });

  test('user deletes a product', async ({
    productDetailsPage,
    productsPage,
  }) => {
    const product = await createProduct();
    await productDetailsPage.forProduct(product.id).open();
    await productDetailsPage.expectProduct(product.name, product.symbol);

    await productDetailsPage.delete(product.name);

    await productsPage.expectToBeOpened();
    expect((await products.get(product.id)).status()).toBe(404);
  });
});

import { DeletePackagesResult, Package } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { MISSING_ID } from '../../test-data/factories';

// Products from testData: 42.50 zł net per 1000 pcs, VAT 23%. Packages: 100 pcs.
test.describe('API: packages', () => {
  test('POST /api/packages creates a package with prices from the product', async ({
    packagesApi,
    testData,
  }) => {
    const platform = await testData.platform();
    const product = await testData.product();
    const input = testData.packageRequest(platform, product, {
      quantity: 100,
      weightG: 450,
    });

    const response = await packagesApi.create(input);

    expect(response.status()).toBe(201);
    const pkg: Package = await response.json();
    expect(pkg).toMatchSchema('PackageDto');
    expect(pkg).toMatchObject({
      name: input.name,
      sku: input.sku,
      platformId: platform.id,
      platformName: platform.name,
      productId: product.id,
      productSymbol: product.symbol,
      quantity: 100,
      vatRate: 23,
      netPrice: 4.25,
      grossPrice: 5.23,
      weightG: 450,
      // Product stock is 0, so no package can be assembled.
      available: 0,
    });
  });

  test('POST /api/packages rejects a duplicate SKU on the same platform', async ({
    packagesApi,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog();

    const response = await packagesApi.create(
      testData.packageRequest(platform, product, { sku: pkg.sku }),
    );

    expect(response.status()).toBe(409);
  });

  test('POST /api/packages rejects Amazon data on a non-Amazon platform', async ({
    packagesApi,
    testData,
  }) => {
    const platform = await testData.platform('OTHER');
    const product = await testData.product();

    const response = await packagesApi.create(
      testData.packageRequest(platform, product, {
        amazon: { asin: 'B0C1234567' },
      }),
    );

    expect(response.status()).toBe(400);
  });

  test('GET /api/packages filters by product', async ({
    packagesApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog();

    const response = await packagesApi.list({ productId: product.id });

    expect(response.status()).toBe(200);
    const body: Package[] = await response.json();
    expect(body).toMatchSchema('PackageDto[]');
    expect(body.map((p) => p.id)).toEqual([pkg.id]);
  });

  test('GET /api/packages/{id} returns the package', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog();

    const response = await packagesApi.get(pkg.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(pkg);
  });

  test('PATCH /api/packages/{id} changes quantity and recalculates prices', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog();

    const response = await packagesApi.update(pkg.id, { quantity: 200 });

    expect(response.status()).toBe(200);
    expect<unknown>(await response.json()).toMatchSchema('PackageDto');
    await expect(response.json()).resolves.toMatchObject({
      quantity: 200,
      netPrice: 8.5,
      grossPrice: 10.46,
    });
  });

  test('platform and product with packages cannot be deleted', async ({
    platformsApi,
    productsApi,
    testData,
  }) => {
    const { platform, product } = await testData.catalog();

    const platformDelete = await platformsApi.delete(platform.id);
    const productDelete = await productsApi.delete(product.id);

    expect(platformDelete.status()).toBe(409);
    expect(productDelete.status()).toBe(409);
  });

  test('POST /api/packages/delete deletes packages and reports missing ones', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog();

    const response = await packagesApi.deleteBulk({
      ids: [pkg.id, MISSING_ID],
    });

    expect(response.status()).toBe(200);
    const body: DeletePackagesResult = await response.json();
    expect(body).toMatchSchema('DeletePackagesResultDto');
    expect(body.deleted).toEqual([pkg.id]);
    expect(body.failed).toEqual([expect.objectContaining({ id: MISSING_ID })]);
    expect((await packagesApi.get(pkg.id)).status()).toBe(404);
  });
});

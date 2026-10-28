import { PackagesApi } from '../../api/PackagesApi';
import { PlatformsApi } from '../../api/PlatformsApi';
import { ProductsApi } from '../../api/ProductsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { DeletePackagesResult, Package } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
} from '../../test-data/catalog';
import { buildPackage } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let packages: PackagesApi;
let catalog: Catalog;
let pkg: Package;

test.describe.configure({ mode: 'serial' });

test.describe('API: packages', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    packages = new PackagesApi(api);
    // Product: 42.50 zł net per 1000 pcs, VAT 23%.
    catalog = await createCatalog(api, { withPackage: false });
  });

  test.afterAll(async () => {
    if (pkg) await deleteIgnoringMissing(await packages.delete(pkg.id));
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('POST /api/packages creates a package with prices from the product', async () => {
    const input = buildPackage(catalog.platform.id, catalog.product.id, {
      quantity: 100,
      weightG: 450,
    });

    const response = await packages.create(input);

    expect(response.status()).toBe(201);
    pkg = await response.json();
    expect(pkg).toMatchObject({
      name: input.name,
      sku: input.sku,
      platformId: catalog.platform.id,
      platformName: catalog.platform.name,
      productId: catalog.product.id,
      productSymbol: catalog.product.symbol,
      quantity: 100,
      vatRate: 23,
      netPrice: 4.25,
      grossPrice: 5.23,
      weightG: 450,
      // Product stock is 0, so no package can be assembled.
      available: 0,
    });
  });

  test('POST /api/packages rejects a duplicate SKU on the same platform', async () => {
    const response = await packages.create(
      buildPackage(catalog.platform.id, catalog.product.id, { sku: pkg.sku }),
    );

    expect(response.status()).toBe(409);
  });

  test('POST /api/packages rejects Amazon data on a non-Amazon platform', async () => {
    const response = await packages.create(
      buildPackage(catalog.platform.id, catalog.product.id, {
        amazon: { asin: 'B0C1234567' },
      }),
    );

    expect(response.status()).toBe(400);
  });

  test('GET /api/packages filters by product', async () => {
    const response = await packages.list({ productId: catalog.product.id });

    expect(response.status()).toBe(200);
    const body: Package[] = await response.json();
    expect(body.map((p) => p.id)).toEqual([pkg.id]);
  });

  test('GET /api/packages/{id} returns the package', async () => {
    const response = await packages.get(pkg.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(pkg);
  });

  test('PATCH /api/packages/{id} changes quantity and recalculates prices', async () => {
    const response = await packages.update(pkg.id, { quantity: 200 });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      quantity: 200,
      netPrice: 8.5,
      grossPrice: 10.46,
    });
  });

  test('platform and product with packages cannot be deleted', async () => {
    const platformDelete = await new PlatformsApi(api).delete(
      catalog.platform.id,
    );
    const productDelete = await new ProductsApi(api).delete(catalog.product.id);

    expect(platformDelete.status()).toBe(409);
    expect(productDelete.status()).toBe(409);
  });

  test('POST /api/packages/delete deletes packages and reports missing ones', async () => {
    const response = await packages.deleteBulk({ ids: [pkg.id, 999_999_999] });

    expect(response.status()).toBe(200);
    const body: DeletePackagesResult = await response.json();
    expect(body.deleted).toEqual([pkg.id]);
    expect(body.failed).toEqual([expect.objectContaining({ id: 999_999_999 })]);
    expect((await packages.get(pkg.id)).status()).toBe(404);
  });
});

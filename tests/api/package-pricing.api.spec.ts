import { PackagesApi } from '../../api/PackagesApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { ErrorResponse, Marketplace, Package } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
  readCreated,
} from '../../test-data/catalog';
import { buildPackage } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let packages: PackagesApi;
// Amazon platform with one package
let catalog: Catalog;
let pkg: Package;
const extraPackageIds: number[] = [];

async function createPackage(platformId: number): Promise<Package> {
  const created = await readCreated<Package>(
    await packages.create(buildPackage(platformId, catalog.product.id)),
    'package',
  );
  extraPackageIds.push(created.id);
  return created;
}

test.describe.configure({ mode: 'serial' });

test.describe('API: Amazon package pricing', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    packages = new PackagesApi(api);
    catalog = await createCatalog(api, { withPackage: true, kind: 'AMAZON' });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    // beforeAll failed (e.g. login) – nothing was created, nothing to clean up.
    if (!api) return;
    for (const id of extraPackageIds) {
      await deleteIgnoringMissing(await packages.delete(id));
    }
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('a new Amazon package has no prices for any market', () => {
    expect(pkg.amazon?.pricing).toEqual({ markets: [] });
  });

  test('PUT /api/packages/{id}/amazon/pricing sets prices per market', async () => {
    const response = await packages.updateAmazonPricing(pkg.id, {
      markets: [
        {
          marketplace: 'DE',
          markup: 10,
          referralFeePercent: 15,
          fbaFeeNet: 2.82,
        },
        { marketplace: 'FR', markup: 8 },
      ],
    });

    expect(response.status()).toBe(200);
    const body: Package = await response.json();
    expect(body).toMatchSchema('PackageDto');
    expect(body.amazon?.pricing.markets).toEqual([
      {
        marketplace: 'DE',
        markup: 10,
        referralFeePercent: 15,
        fbaFeeNet: 2.82,
      },
      { marketplace: 'FR', markup: 8 },
    ]);
  });

  test('PUT changes only sent fields; null clears a value and an empty market disappears', async () => {
    const response = await packages.updateAmazonPricing(pkg.id, {
      markets: [
        { marketplace: 'FR', markup: null },
        {
          marketplace: 'DE',
          checkPrice: 39.99,
          msrpPercent: 20,
          quantityDiscountPercent: 5,
        },
      ],
    });

    expect(response.status()).toBe(200);
    const expected = [
      {
        marketplace: 'DE',
        markup: 10,
        referralFeePercent: 15,
        fbaFeeNet: 2.82,
        checkPrice: 39.99,
        msrpPercent: 20,
        quantityDiscountPercent: 5,
      },
    ];
    const body: Package = await response.json();
    expect(body.amazon?.pricing.markets).toEqual(expected);
    // Saved, not only returned
    const saved: Package = await (await packages.get(pkg.id)).json();
    expect(saved.amazon?.pricing.markets).toEqual(expected);
  });

  test('PUT /api/packages/amazon/pricing updates many packages at once', async () => {
    const second = await createPackage(catalog.platform.id);

    const response = await packages.updateAmazonPricingMany({
      items: [
        { id: pkg.id, markets: [{ marketplace: 'IT', markup: 3 }] },
        { id: second.id, markets: [{ marketplace: 'IT', markup: 4 }] },
      ],
    });

    expect(response.status()).toBe(200);
    const body: Package[] = await response.json();
    expect(body).toMatchSchema('PackageDto[]');
    expect(
      body.map((p) =>
        p.amazon?.pricing.markets.find((m) => m.marketplace === 'IT'),
      ),
    ).toEqual([
      { marketplace: 'IT', markup: 3 },
      { marketplace: 'IT', markup: 4 },
    ]);
  });

  test('PUT /api/packages/amazon/pricing saves nothing when one package is missing', async () => {
    const response = await packages.updateAmazonPricingMany({
      items: [
        { id: pkg.id, markets: [{ marketplace: 'ES', markup: 3 }] },
        { id: 999_999_999, markets: [{ marketplace: 'ES', markup: 4 }] },
      ],
    });

    expect(response.status()).toBe(404);
    const saved: Package = await (await packages.get(pkg.id)).json();
    expect(
      saved.amazon?.pricing.markets.map((m) => m.marketplace),
    ).not.toContain('ES');
  });

  test('PUT rejects a referral fee above 99%', async () => {
    const response = await packages.updateAmazonPricing(pkg.id, {
      markets: [{ marketplace: 'DE', referralFeePercent: 150 }],
    });

    expect(response.status()).toBe(400);
    const body: ErrorResponse = await response.json();
    expect(body.message).toEqual([
      'markets.0.referralFeePercent must not be greater than 99',
    ]);
  });

  test('PUT rejects an unknown marketplace', async () => {
    const response = await packages.updateAmazonPricing(pkg.id, {
      // Deliberately invalid value, not allowed by the type
      markets: [{ marketplace: 'XX' as Marketplace, markup: 1 }],
    });

    expect(response.status()).toBe(400);
  });

  test('PUT is only for packages of an Amazon platform', async () => {
    const other = await createCatalog(api, { withPackage: true });
    try {
      const response = await packages.updateAmazonPricing(
        (other.pkg as Package).id,
        { markets: [{ marketplace: 'DE', markup: 1 }] },
      );

      expect(response.status()).toBe(400);
    } finally {
      await deleteCatalog(api, other);
    }
  });

  test('PUT returns 404 for a missing package', async () => {
    const response = await packages.updateAmazonPricing(999_999_999, {
      markets: [{ marketplace: 'DE', markup: 1 }],
    });

    expect(response.status()).toBe(404);
  });
});

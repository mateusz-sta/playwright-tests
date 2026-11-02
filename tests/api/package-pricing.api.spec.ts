import { PackagesApi } from '../../api/PackagesApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { ErrorResponse, Marketplace, Package } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { Catalog, createCatalog, deleteCatalog } from '../../test-data/catalog';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let packages: PackagesApi;
let catalog: Catalog;
let pkg: Package;

test.describe.configure({ mode: 'serial' });

test.describe('API: package pricing', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    packages = new PackagesApi(api);
    catalog = await createCatalog(api, { withPackage: true, kind: 'AMAZON' });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    // beforeAll failed (e.g. login) – nothing was created, nothing to clean up.
    if (!api) return;
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('a new package has empty pricing', () => {
    expect(pkg.pricing).toEqual({ fbaFees: [] });
  });

  test('PUT /api/packages/{id}/pricing sets markup, referral fee and FBA fees', async () => {
    const response = await packages.updatePricing(pkg.id, {
      markupEur: 10,
      referralFeePercent: 15,
      fbaFees: [
        { marketplace: 'DE', feeNet: 2.82 },
        { marketplace: 'FR', feeNet: 3.1 },
      ],
    });

    expect(response.status()).toBe(200);
    const body: Package = await response.json();
    expect(body).toMatchSchema('PackageDto');
    expect(body.pricing).toEqual({
      markupEur: 10,
      referralFeePercent: 15,
      fbaFees: [
        { marketplace: 'DE', feeNet: 2.82 },
        { marketplace: 'FR', feeNet: 3.1 },
      ],
    });
  });

  test('PUT changes only the sent fields; feeNet: null removes a country', async () => {
    const response = await packages.updatePricing(pkg.id, {
      fbaFees: [{ marketplace: 'FR', feeNet: null }],
    });

    expect(response.status()).toBe(200);
    const body: Package = await response.json();
    expect(body.pricing).toEqual({
      markupEur: 10,
      referralFeePercent: 15,
      fbaFees: [{ marketplace: 'DE', feeNet: 2.82 }],
    });
    // Saved, not only returned
    const saved: Package = await (await packages.get(pkg.id)).json();
    expect(saved.pricing).toEqual(body.pricing);
  });

  test('PUT rejects a referral fee above 99%', async () => {
    const response = await packages.updatePricing(pkg.id, {
      referralFeePercent: 150,
    });

    expect(response.status()).toBe(400);
    const body: ErrorResponse = await response.json();
    expect(body.message).toEqual([
      'referralFeePercent must not be greater than 99',
    ]);
  });

  test('PUT rejects an unknown marketplace', async () => {
    const response = await packages.updatePricing(pkg.id, {
      // Deliberately invalid value, not allowed by the type
      fbaFees: [{ marketplace: 'XX' as Marketplace, feeNet: 1 }],
    });

    expect(response.status()).toBe(400);
  });

  test('PUT returns 404 for a missing package', async () => {
    const response = await packages.updatePricing(999_999_999, {
      markupEur: 1,
    });

    expect(response.status()).toBe(404);
  });
});

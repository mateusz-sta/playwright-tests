import {
  ErrorResponse,
  MarketPricingInput,
  Marketplace,
  Package,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { MISSING_ID } from '../../test-data/factories';

const DE_AND_FR: MarketPricingInput[] = [
  {
    marketplace: 'DE',
    markup: 10,
    referralFeePercent: 15,
    fbaFeeNet: 2.82,
  },
  { marketplace: 'FR', markup: 8 },
];

test.describe('API: Amazon package pricing', () => {
  test('a new Amazon package has no prices for any market', async ({
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });

    expect(pkg.amazon?.pricing).toEqual({ markets: [] });
  });

  test('PUT /api/packages/{id}/amazon/pricing sets prices per market', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });

    const response = await packagesApi.updateAmazonPricing(pkg.id, {
      markets: DE_AND_FR,
    });

    expect(response.status()).toBe(200);
    const body: Package = await response.json();
    expect(body).toMatchSchema('PackageDto');
    expect(body.amazon?.pricing.markets).toEqual(DE_AND_FR);
  });

  test('PUT changes only sent fields; null clears a value and an empty market disappears', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });
    const before = await packagesApi.updateAmazonPricing(pkg.id, {
      markets: DE_AND_FR,
    });
    expect(before.status()).toBe(200);

    const response = await packagesApi.updateAmazonPricing(pkg.id, {
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
    const saved: Package = await (await packagesApi.get(pkg.id)).json();
    expect(saved.amazon?.pricing.markets).toEqual(expected);
  });

  test('PUT /api/packages/amazon/pricing updates many packages at once', async ({
    packagesApi,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog({
      kind: 'AMAZON',
    });
    const second = await testData.package(platform, product);

    const response = await packagesApi.updateAmazonPricingMany({
      items: [
        { id: pkg.id, markets: [{ marketplace: 'IT', markup: 3 }] },
        { id: second.id, markets: [{ marketplace: 'IT', markup: 4 }] },
      ],
    });

    expect(response.status()).toBe(200);
    const body: Package[] = await response.json();
    expect(body).toMatchSchema('PackageDto[]');
    expect(body.map((p) => p.amazon?.pricing.markets)).toEqual([
      [{ marketplace: 'IT', markup: 3 }],
      [{ marketplace: 'IT', markup: 4 }],
    ]);
  });

  test('PUT /api/packages/amazon/pricing saves nothing when one package is missing', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });

    const response = await packagesApi.updateAmazonPricingMany({
      items: [
        { id: pkg.id, markets: [{ marketplace: 'ES', markup: 3 }] },
        { id: MISSING_ID, markets: [{ marketplace: 'ES', markup: 4 }] },
      ],
    });

    expect(response.status()).toBe(404);
    const saved: Package = await (await packagesApi.get(pkg.id)).json();
    expect(saved.amazon?.pricing.markets).toEqual([]);
  });

  test('PUT rejects a referral fee above 99%', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });

    const response = await packagesApi.updateAmazonPricing(pkg.id, {
      markets: [{ marketplace: 'DE', referralFeePercent: 150 }],
    });

    expect(response.status()).toBe(400);
    const body: ErrorResponse = await response.json();
    expect(body.message).toEqual([
      'markets.0.referralFeePercent must not be greater than 99',
    ]);
  });

  test('PUT rejects an unknown marketplace', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'AMAZON' });

    const response = await packagesApi.updateAmazonPricing(pkg.id, {
      // Deliberately invalid value, not allowed by the type
      markets: [{ marketplace: 'XX' as Marketplace, markup: 1 }],
    });

    expect(response.status()).toBe(400);
  });

  test('PUT is only for packages of an Amazon platform', async ({
    packagesApi,
    testData,
  }) => {
    const { pkg } = await testData.catalog({ kind: 'OTHER' });

    const response = await packagesApi.updateAmazonPricing(pkg.id, {
      markets: [{ marketplace: 'DE', markup: 1 }],
    });

    expect(response.status()).toBe(400);
  });

  test('PUT returns 404 for a missing package', async ({ packagesApi }) => {
    const response = await packagesApi.updateAmazonPricing(MISSING_ID, {
      markets: [{ marketplace: 'DE', markup: 1 }],
    });

    expect(response.status()).toBe(404);
  });
});

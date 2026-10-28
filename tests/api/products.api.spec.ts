import { ProductsApi } from '../../api/ProductsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import {
  DeleteProductsResult,
  ErrorResponse,
  Product,
  StockMovement,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { buildProduct } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

const MISSING_ID = 999_999_999;

let api: APIRequestContext;
let products: ProductsApi;
const createdIds: number[] = [];

test.describe('API: products', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    products = new ProductsApi(api);
  });

  test.afterAll(async () => {
    await products.deleteBulk({ ids: createdIds });
    await api.dispose();
  });

  test.describe('product lifecycle', () => {
    test.describe.configure({ mode: 'serial' });

    const input = buildProduct({ netPricePer1000: 42.5, vatRate: 23 });
    let product: Product;

    test('POST /api/products creates a product and calculates prices', async () => {
      const response = await products.create(input);

      expect(response.status()).toBe(201);
      product = await response.json();
      createdIds.push(product.id);
      expect(product).toEqual({
        id: expect.any(Number),
        name: input.name,
        symbol: input.symbol,
        vatRate: 23,
        netPricePer1000: 42.5,
        grossPricePer1000: 52.28,
        netUnitPrice: 0.0425,
        grossUnitPrice: 0.05228,
        stock: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('GET /api/products/{id} returns the product', async () => {
      const response = await products.get(product.id);

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual(product);
    });

    test('GET /api/products lists the product', async () => {
      const response = await products.list();

      expect(response.status()).toBe(200);
      const body: Product[] = await response.json();
      expect(body).toContainEqual(product);
    });

    test('PATCH /api/products/{id} updates the price and recalculates it', async () => {
      const response = await products.update(product.id, {
        netPricePer1000: 20,
        vatRate: 5,
      });

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: product.id,
        netPricePer1000: 20,
        vatRate: 5,
        grossPricePer1000: 21,
        netUnitPrice: 0.02,
        grossUnitPrice: 0.021,
      });
    });

    test('POST /api/products rejects a duplicate symbol', async () => {
      const response = await products.create(
        buildProduct({ symbol: input.symbol }),
      );

      expect(response.status()).toBe(409);
    });

    test('GET /api/products/{id}/movements is empty for a new product', async () => {
      const response = await products.movements(product.id);

      expect(response.status()).toBe(200);
      const body: StockMovement[] = await response.json();
      expect(body).toEqual([]);
    });

    test('DELETE /api/products/{id} deletes the product', async () => {
      const response = await products.delete(product.id);

      expect(response.status()).toBe(204);
      expect((await products.get(product.id)).status()).toBe(404);
    });
  });

  test.describe('validation', () => {
    test('POST /api/products rejects invalid data', async () => {
      const response = await products.create({
        name: '',
        symbol: '',
        netPricePer1000: -1,
        vatRate: 7,
      });

      expect(response.status()).toBe(400);
      const body: ErrorResponse = await response.json();
      expect(body.message).toEqual(
        expect.arrayContaining([
          'name should not be empty',
          'symbol should not be empty',
          'netPricePer1000 must not be less than 0',
          'vatRate must be one of the following values: 23, 8, 5, 0',
        ]),
      );
    });

    test('GET /api/products/{id} returns 404 for a missing product', async () => {
      const response = await products.get(MISSING_ID);

      expect(response.status()).toBe(404);
    });

    test('GET /api/products/{id} returns 400 for a non-numeric id', async () => {
      const response = await products.get('abc');

      expect(response.status()).toBe(400);
    });
  });

  test.describe('bulk operations', () => {
    test('POST /api/products/bulk creates many and /delete removes them', async () => {
      const inputs = [buildProduct(), buildProduct()];

      const created = await products.createBulk(inputs);
      expect(created.status()).toBe(201);
      const body: Product[] = await created.json();
      createdIds.push(...body.map((p) => p.id));
      expect(body.map((p) => p.symbol)).toEqual(inputs.map((p) => p.symbol));

      const deleted = await products.deleteBulk({
        ids: [...body.map((p) => p.id), MISSING_ID],
      });
      expect(deleted.status()).toBe(200);
      const result: DeleteProductsResult = await deleted.json();
      expect(result.deleted.sort()).toEqual(body.map((p) => p.id).sort());
      expect(result.failed).toEqual([
        expect.objectContaining({ id: MISSING_ID }),
      ]);
    });
  });
});

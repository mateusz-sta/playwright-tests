import {
  DeleteProductsResult,
  ErrorResponse,
  Product,
  StockMovement,
} from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { MISSING_ID } from '../../test-data/factories';

test.describe('API: products', () => {
  test.describe('product lifecycle', () => {
    test('POST /api/products creates a product and calculates prices', async ({
      productsApi,
      testData,
    }) => {
      const input = testData.productRequest({
        netPricePer1000: 42.5,
        vatRate: 23,
      });

      const response = await productsApi.create(input);

      expect(response.status()).toBe(201);
      const product: Product = await response.json();
      expect(product).toMatchSchema('ProductDto');
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
        // No group set by hand – the app derives it from the symbol.
        groupCode: null,
        groupName: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('GET /api/products/{id} returns the product', async ({
      productsApi,
      testData,
    }) => {
      const product = await testData.product();

      const response = await productsApi.get(product.id);

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual(product);
    });

    test('GET /api/products lists the product', async ({
      productsApi,
      testData,
    }) => {
      const product = await testData.product();

      const response = await productsApi.list();

      expect(response.status()).toBe(200);
      const body: Product[] = await response.json();
      expect(body).toMatchSchema('ProductDto[]');
      expect(body).toContainEqual(product);
    });

    test('PATCH /api/products/{id} updates the price and recalculates it', async ({
      productsApi,
      testData,
    }) => {
      const product = await testData.product();

      const response = await productsApi.update(product.id, {
        netPricePer1000: 20,
        vatRate: 5,
      });

      expect(response.status()).toBe(200);
      expect<unknown>(await response.json()).toMatchSchema('ProductDto');
      await expect(response.json()).resolves.toMatchObject({
        id: product.id,
        netPricePer1000: 20,
        vatRate: 5,
        grossPricePer1000: 21,
        netUnitPrice: 0.02,
        grossUnitPrice: 0.021,
      });
    });

    test('POST /api/products rejects a duplicate symbol', async ({
      productsApi,
      testData,
    }) => {
      const product = await testData.product();

      const response = await productsApi.create(
        testData.productRequest({ symbol: product.symbol }),
      );

      expect(response.status()).toBe(409);
    });

    test('GET /api/products/{id}/movements is empty for a new product', async ({
      productsApi,
      testData,
    }) => {
      const product = await testData.product();

      const response = await productsApi.movements(product.id);

      expect(response.status()).toBe(200);
      const body: StockMovement[] = await response.json();
      expect(body).toMatchSchema('StockMovementDto[]');
      expect(body).toEqual([]);
    });

    test('DELETE /api/products/{id} deletes the product', async ({
      productsApi,
      testData,
    }) => {
      const product = await testData.product();

      const response = await productsApi.delete(product.id);

      expect(response.status()).toBe(204);
      expect((await productsApi.get(product.id)).status()).toBe(404);
    });
  });

  test.describe('validation', () => {
    test('POST /api/products rejects invalid data', async ({ productsApi }) => {
      const response = await productsApi.create({
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

    test('GET /api/products/{id} returns 404 for a missing product', async ({
      productsApi,
    }) => {
      const response = await productsApi.get(MISSING_ID);

      expect(response.status()).toBe(404);
    });

    test('GET /api/products/{id} returns 400 for a non-numeric id', async ({
      productsApi,
    }) => {
      const response = await productsApi.get('abc');

      expect(response.status()).toBe(400);
    });
  });

  test.describe('bulk operations', () => {
    test('POST /api/products/bulk creates many and /delete removes them', async ({
      productsApi,
      testData,
    }) => {
      const inputs = [testData.productRequest(), testData.productRequest()];

      const created = await productsApi.createBulk(inputs);
      expect(created.status()).toBe(201);
      const body: Product[] = await created.json();
      expect(body).toMatchSchema('ProductDto[]');
      expect(body.map((p) => p.symbol)).toEqual(inputs.map((p) => p.symbol));

      const deleted = await productsApi.deleteBulk({
        ids: [...body.map((p) => p.id), MISSING_ID],
      });
      expect(deleted.status()).toBe(200);
      const result: DeleteProductsResult = await deleted.json();
      expect(result).toMatchSchema('DeleteProductsResultDto');
      expect(result.deleted.sort()).toEqual(body.map((p) => p.id).sort());
      expect(result.failed).toEqual([
        expect.objectContaining({ id: MISSING_ID }),
      ]);
    });
  });
});

import { Order, OrderSummary } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { today } from '../../test-data/factories';

// Orders from testData have 10 pcs of the product and 3 packages of 100 pcs.
test.describe('API: orders', () => {
  test('POST /api/orders creates an order with product and package items', async ({
    ordersApi,
    testData,
  }) => {
    const { product, pkg } = await testData.catalog();
    const name = testData.orderName();

    const response = await ordersApi.create({
      name,
      date: today(),
      note: 'Created by API tests',
      items: [
        { productId: product.id, quantity: 10 },
        { packageId: pkg.id, quantity: 3 },
      ],
    });

    expect(response.status()).toBe(201);
    const order: Order = await response.json();
    expect(order).toMatchSchema('OrderDto');
    expect(order).toMatchObject({
      name,
      itemCount: 2,
      items: [
        {
          position: 1,
          productId: product.id,
          unitsPerItem: 1,
          quantity: 10,
          units: 10,
        },
        {
          position: 2,
          productId: product.id,
          packageId: pkg.id,
          sku: pkg.sku,
          unitsPerItem: 100,
          quantity: 3,
          units: 300,
        },
      ],
    });
  });

  test('orders do not change product stock', async ({ testData }) => {
    const catalog = await testData.catalog({ stock: 500 });

    await testData.order(catalog);

    expect(await testData.stockOf(catalog.product)).toBe(500);
  });

  test('GET /api/orders/{id} returns the order', async ({
    ordersApi,
    testData,
  }) => {
    const order = await testData.order(await testData.catalog());

    const response = await ordersApi.get(order.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(order);
  });

  test('GET /api/orders lists the order', async ({ ordersApi, testData }) => {
    const order = await testData.order(await testData.catalog());

    const response = await ordersApi.list();

    expect(response.status()).toBe(200);
    const body: OrderSummary[] = await response.json();
    expect(body).toMatchSchema('OrderSummaryDto[]');
    expect(body).toContainEqual(
      expect.objectContaining({ id: order.id, itemCount: 2 }),
    );
  });

  test('PUT /api/orders/{id} replaces the items', async ({
    ordersApi,
    testData,
  }) => {
    const catalog = await testData.catalog();
    const order = await testData.order(catalog);

    const response = await ordersApi.replace(order.id, {
      items: [{ packageId: catalog.pkg.id, quantity: 5 }],
    });

    expect(response.status()).toBe(200);
    const body: Order = await response.json();
    expect(body).toMatchSchema('OrderDto');
    expect(body.itemCount).toBe(1);
    expect(body.items).toEqual([
      expect.objectContaining({
        packageId: catalog.pkg.id,
        quantity: 5,
        units: 500,
      }),
    ]);
  });

  test('POST /api/orders rejects an order without a date', async ({
    ordersApi,
    testData,
  }) => {
    const product = await testData.product();

    const response = await ordersApi.create({
      name: testData.orderName(),
      date: 'not-a-date',
      items: [{ productId: product.id, quantity: 1 }],
    });

    expect(response.status()).toBe(400);
  });

  test('DELETE /api/orders/{id} deletes the order', async ({
    ordersApi,
    testData,
  }) => {
    const order = await testData.order(await testData.catalog());

    const response = await ordersApi.delete(order.id);

    expect(response.status()).toBe(204);
    expect((await ordersApi.get(order.id)).status()).toBe(404);
  });
});

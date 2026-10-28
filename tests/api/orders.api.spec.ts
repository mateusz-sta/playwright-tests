import { OrdersApi } from '../../api/OrdersApi';
import { ProductsApi } from '../../api/ProductsApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Order, OrderSummary, Package } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
} from '../../test-data/catalog';
import { TEST_PREFIX, today, uniqueId } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let orders: OrdersApi;
let catalog: Catalog;
let pkg: Package;
let order: Order;

test.describe.configure({ mode: 'serial' });

test.describe('API: orders', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    orders = new OrdersApi(api);
    // Package = 100 pcs of the product.
    catalog = await createCatalog(api, { withPackage: true });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    if (order) await deleteIgnoringMissing(await orders.delete(order.id));
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('POST /api/orders creates an order with product and package items', async () => {
    const name = `${TEST_PREFIX} order ${uniqueId()}`;

    const response = await orders.create({
      name,
      date: today(),
      note: 'Created by API tests',
      items: [
        { productId: catalog.product.id, quantity: 10 },
        { packageId: pkg.id, quantity: 3 },
      ],
    });

    expect(response.status()).toBe(201);
    order = await response.json();
    expect(order).toMatchSchema('OrderDto');
    expect(order).toMatchObject({
      name,
      itemCount: 2,
      items: [
        {
          position: 1,
          productId: catalog.product.id,
          unitsPerItem: 1,
          quantity: 10,
          units: 10,
        },
        {
          position: 2,
          productId: catalog.product.id,
          packageId: pkg.id,
          sku: pkg.sku,
          unitsPerItem: 100,
          quantity: 3,
          units: 300,
        },
      ],
    });
  });

  test('orders do not change product stock', async () => {
    const response = await new ProductsApi(api).get(catalog.product.id);

    await expect(response.json()).resolves.toHaveProperty('stock', 0);
  });

  test('GET /api/orders/{id} returns the order', async () => {
    const response = await orders.get(order.id);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(order);
  });

  test('GET /api/orders lists the order', async () => {
    const response = await orders.list();

    expect(response.status()).toBe(200);
    const body: OrderSummary[] = await response.json();
    expect(body).toMatchSchema('OrderSummaryDto[]');
    expect(body).toContainEqual(
      expect.objectContaining({ id: order.id, itemCount: 2 }),
    );
  });

  test('PUT /api/orders/{id} replaces the items', async () => {
    const response = await orders.replace(order.id, {
      items: [{ packageId: pkg.id, quantity: 5 }],
    });

    expect(response.status()).toBe(200);
    const body: Order = await response.json();
    expect(body).toMatchSchema('OrderDto');
    expect(body.itemCount).toBe(1);
    expect(body.items).toEqual([
      expect.objectContaining({ packageId: pkg.id, quantity: 5, units: 500 }),
    ]);
  });

  test('POST /api/orders rejects an order without a date', async () => {
    const response = await orders.create({
      name: `${TEST_PREFIX} invalid`,
      date: 'not-a-date',
      items: [{ productId: catalog.product.id, quantity: 1 }],
    });

    expect(response.status()).toBe(400);
  });

  test('DELETE /api/orders/{id} deletes the order', async () => {
    const response = await orders.delete(order.id);

    expect(response.status()).toBe(204);
    expect((await orders.get(order.id)).status()).toBe(404);
  });
});

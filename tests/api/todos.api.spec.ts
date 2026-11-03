import { TodosApi } from '../../api/TodosApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Package, ResolveSkusResult, Todo } from '../../api/types';
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
let todos: TodosApi;
// Amazon platform, package with ASIN B0C1234567 / FNSKU X001ABC123
let catalog: Catalog;
let pkg: Package;
const createdTodoIds: number[] = [];

test.describe('API: to-do notes', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    todos = new TodosApi(api);
    catalog = await createCatalog(api, { withPackage: true, kind: 'AMAZON' });
    pkg = catalog.pkg as Package;
  });

  test.afterAll(async () => {
    // beforeAll failed (e.g. login) – nothing was created, nothing to clean up.
    if (!api) return;
    for (const id of createdTodoIds) {
      await deleteIgnoringMissing(await todos.delete(id));
    }
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test.describe('POST /api/todos/resolve-skus', () => {
    test('maps SKUs to packages, keeps the order and reports unknown and repeated ones', async () => {
      const response = await todos.resolveSkus({
        platformId: catalog.platform.id,
        skus: [pkg.sku, '   ', 'PW-TEST-UNKNOWN', pkg.sku],
      });

      expect(response.status()).toBe(200);
      const body: ResolveSkusResult = await response.json();
      expect(body).toMatchSchema('ResolveSkusResultDto');
      expect(body).toEqual({
        items: [
          {
            sku: pkg.sku,
            packageId: pkg.id,
            packageName: pkg.name,
            asin: 'B0C1234567',
          },
          { sku: 'PW-TEST-UNKNOWN' },
        ],
        notFound: ['PW-TEST-UNKNOWN'],
        duplicates: [pkg.sku],
      });
    });

    test('rejects a missing platform', async () => {
      const response = await todos.resolveSkus({
        platformId: 999_999_999,
        skus: ['ANY'],
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('note lifecycle', () => {
    test.describe.configure({ mode: 'serial' });

    let note: Todo;

    test('POST /api/todos creates a general note without packages', async () => {
      const title = `${TEST_PREFIX} note ${uniqueId()}`;

      const response = await todos.create({
        title,
        content: 'Created by API tests',
        date: today(),
      });

      expect(response.status()).toBe(201);
      const body: Todo = await response.json();
      createdTodoIds.push(body.id);
      expect(body).toMatchSchema('TodoDto');
      expect(body).toMatchObject({ title, done: false, items: [] });
    });

    test('POST /api/todos links known SKUs to packages and keeps unknown ones as text', async () => {
      const response = await todos.create({
        title: `${TEST_PREFIX} note ${uniqueId()}`,
        date: today(),
        platformId: catalog.platform.id,
        items: [
          { sku: pkg.sku, content: 'new parent' },
          { sku: 'PW-TEST-NO-PACKAGE', asin: 'B0MANUAL01' },
        ],
      });

      expect(response.status()).toBe(201);
      note = await response.json();
      createdTodoIds.push(note.id);
      expect(note).toMatchSchema('TodoDto');
      expect(note.platformName).toBe(catalog.platform.name);
      expect(note.items).toEqual([
        {
          id: expect.any(Number),
          position: 1,
          sku: pkg.sku,
          packageId: pkg.id,
          packageName: pkg.name,
          asin: 'B0C1234567',
          fnsku: 'X001ABC123',
          content: 'new parent',
          done: false,
        },
        {
          id: expect.any(Number),
          position: 2,
          sku: 'PW-TEST-NO-PACKAGE',
          asin: 'B0MANUAL01',
          done: false,
        },
      ]);
    });

    test('PATCH /api/todos/{id}/items/{itemId} checks one item', async () => {
      const response = await todos.updateItem(note.id, note.items[0].id, {
        done: true,
        content: 'checked',
      });

      expect(response.status()).toBe(200);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body.items[0]).toMatchObject({ done: true, content: 'checked' });
      // One item is still open, so the note is not done
      expect(body.done).toBe(false);
    });

    test('PATCH /api/todos/{id}/items checks all items and the note becomes done', async () => {
      const response = await todos.updateItems(note.id, {
        itemIds: note.items.map((i) => i.id),
        done: true,
      });

      expect(response.status()).toBe(200);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body.items.every((i) => i.done)).toBe(true);
      expect(body.done).toBe(true);
    });

    test('GET /api/todos/{id} returns the saved note', async () => {
      const response = await todos.get(note.id);

      expect(response.status()).toBe(200);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body.done).toBe(true);
    });

    test('GET /api/todos lists the note', async () => {
      const response = await todos.list();

      expect(response.status()).toBe(200);
      const body: Todo[] = await response.json();
      expect(body).toMatchSchema('TodoDto[]');
      expect(body.map((t) => t.id)).toContain(note.id);
    });

    test('PUT /api/todos/{id} replaces items with new, unchecked ones', async () => {
      const title = `${TEST_PREFIX} renamed ${uniqueId()}`;

      const response = await todos.replace(note.id, {
        title,
        items: [{ sku: pkg.sku }],
      });

      expect(response.status()).toBe(200);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body.title).toBe(title);
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({ position: 1, done: false });
      expect(body.items[0].id).not.toBe(note.items[0].id);
      expect(body.done).toBe(false);
    });

    test('DELETE /api/todos/{id} deletes the note', async () => {
      const response = await todos.delete(note.id);

      expect(response.status()).toBe(204);
      expect((await todos.get(note.id)).status()).toBe(404);
    });
  });

  test.describe('validation', () => {
    test('a note with packages needs a platform', async () => {
      const response = await todos.create({
        title: `${TEST_PREFIX} invalid`,
        date: today(),
        items: [{ sku: pkg.sku }],
      });

      expect(response.status()).toBe(400);
    });

    test('a note needs a title', async () => {
      const response = await todos.create({ title: '', date: today() });

      expect(response.status()).toBe(400);
    });
  });
});

import { ResolveSkusResult, Todo } from '../../api/types';
import { expect, test } from '../../fixtures/fixtures';
import { MISSING_ID, today } from '../../test-data/factories';

// Amazon packages from testData have ASIN B0C1234567 / FNSKU X001ABC123.
// Notes from testData have two open items: the package and a SKU without a package.
test.describe('API: to-do notes', () => {
  test.describe('POST /api/todos/resolve-skus', () => {
    test('maps SKUs to packages, keeps the order and reports unknown and repeated ones', async ({
      testData,
      todosApi,
    }) => {
      const { platform, pkg } = await testData.catalog({ kind: 'AMAZON' });

      const response = await todosApi.resolveSkus({
        platformId: platform.id,
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

    test('rejects a missing platform', async ({ todosApi }) => {
      const response = await todosApi.resolveSkus({
        platformId: MISSING_ID,
        skus: ['ANY'],
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('note lifecycle', () => {
    test('POST /api/todos creates a general note without packages', async ({
      testData,
      todosApi,
    }) => {
      const title = testData.todoTitle();

      const response = await todosApi.create({
        title,
        content: 'Created by API tests',
        date: today(),
      });

      expect(response.status()).toBe(201);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body).toMatchObject({ title, done: false, items: [] });
    });

    test('POST /api/todos links known SKUs to packages and keeps unknown ones as text', async ({
      testData,
      todosApi,
    }) => {
      const { platform, pkg } = await testData.catalog({ kind: 'AMAZON' });

      const response = await todosApi.create({
        title: testData.todoTitle(),
        date: today(),
        platformId: platform.id,
        items: [
          { sku: pkg.sku, content: 'new parent' },
          { sku: 'PW-TEST-NO-PACKAGE', asin: 'B0MANUAL01' },
        ],
      });

      expect(response.status()).toBe(201);
      const note: Todo = await response.json();
      expect(note).toMatchSchema('TodoDto');
      expect(note.platformName).toBe(platform.name);
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

    test('PATCH /api/todos/{id}/items/{itemId} checks one item', async ({
      testData,
      todosApi,
    }) => {
      const note = await testData.todo(
        await testData.catalog({ kind: 'AMAZON' }),
      );

      const response = await todosApi.updateItem(note.id, note.items[0].id, {
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

    test('PATCH /api/todos/{id}/items checks all items and the note becomes done', async ({
      testData,
      todosApi,
    }) => {
      const note = await testData.todo(
        await testData.catalog({ kind: 'AMAZON' }),
      );

      const response = await todosApi.updateItems(note.id, {
        itemIds: note.items.map((i) => i.id),
        done: true,
      });

      expect(response.status()).toBe(200);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body.items.map((i) => i.done)).toEqual([true, true]);
      expect(body.done).toBe(true);
    });

    test('GET /api/todos/{id} returns the saved note', async ({
      testData,
      todosApi,
    }) => {
      const note = await testData.todo(
        await testData.catalog({ kind: 'AMAZON' }),
      );

      const response = await todosApi.get(note.id);

      expect(response.status()).toBe(200);
      const body: Todo = await response.json();
      expect(body).toMatchSchema('TodoDto');
      expect(body).toEqual(note);
    });

    test('GET /api/todos lists the note', async ({ testData, todosApi }) => {
      const note = await testData.todo(
        await testData.catalog({ kind: 'AMAZON' }),
      );

      const response = await todosApi.list();

      expect(response.status()).toBe(200);
      const body: Todo[] = await response.json();
      expect(body).toMatchSchema('TodoDto[]');
      expect(body.map((t) => t.id)).toContain(note.id);
    });

    test('PUT /api/todos/{id} replaces items with new, unchecked ones', async ({
      testData,
      todosApi,
    }) => {
      const catalog = await testData.catalog({ kind: 'AMAZON' });
      const note = await testData.todo(catalog);
      const checked = await todosApi.updateItems(note.id, {
        itemIds: note.items.map((i) => i.id),
        done: true,
      });
      expect(checked.status()).toBe(200);
      const title = testData.todoTitle();

      const response = await todosApi.replace(note.id, {
        title,
        items: [{ sku: catalog.pkg.sku }],
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

    test('DELETE /api/todos/{id} deletes the note', async ({
      testData,
      todosApi,
    }) => {
      const note = await testData.todo(
        await testData.catalog({ kind: 'AMAZON' }),
      );

      const response = await todosApi.delete(note.id);

      expect(response.status()).toBe(204);
      expect((await todosApi.get(note.id)).status()).toBe(404);
    });
  });

  test.describe('validation', () => {
    test('a note with packages needs a platform', async ({
      testData,
      todosApi,
    }) => {
      const { pkg } = await testData.catalog({ kind: 'AMAZON' });

      const response = await todosApi.create({
        title: testData.todoTitle(),
        date: today(),
        items: [{ sku: pkg.sku }],
      });

      expect(response.status()).toBe(400);
    });

    test('a note needs a title', async ({ todosApi }) => {
      const response = await todosApi.create({ title: '', date: today() });

      expect(response.status()).toBe(400);
    });
  });
});

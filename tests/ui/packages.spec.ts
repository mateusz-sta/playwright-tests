import { DocumentsApi } from '../../api/DocumentsApi';
import { PackagesApi } from '../../api/PackagesApi';
import { createAuthorizedContext } from '../../api/apiContext';
import { Package } from '../../api/types';
import { test } from '../../fixtures/fixtures';
import {
  Catalog,
  createCatalog,
  deleteCatalog,
  deleteIgnoringMissing,
  readCreated,
} from '../../test-data/catalog';
import { today } from '../../test-data/factories';
import { getTestUser } from '../../test-data/users';
import { APIRequestContext } from '@playwright/test';

let api: APIRequestContext;
let packagesApi: PackagesApi;
let documents: DocumentsApi;
// Amazon platform + product (no package)
let catalog: Catalog;
const packageIds: number[] = [];
const documentIds: number[] = [];

test.describe('Packages', () => {
  test.beforeAll(async ({ playwright }) => {
    api = await createAuthorizedContext(playwright.request, getTestUser());
    packagesApi = new PackagesApi(api);
    documents = new DocumentsApi(api);
    catalog = await createCatalog(api, { withPackage: false, kind: 'AMAZON' });
  });

  test.afterAll(async () => {
    if (!api) return;
    for (const id of documentIds) {
      await deleteIgnoringMissing(await documents.delete(id));
    }
    for (const id of packageIds) {
      await deleteIgnoringMissing(await packagesApi.delete(id));
    }
    await deleteCatalog(api, catalog);
    await api.dispose();
  });

  test('user adds an Amazon package with suggested name and SKU', async ({
    packageFormPage,
    packagesListPage,
  }) => {
    const { product, platform } = catalog;
    await packageFormPage.forPlatform(platform.id).open();
    await packageFormPage.expectCodeInputDisabledUntilTypeChosen();

    await packageFormPage.fillForm({ product: product.symbol, quantity: 50 });
    await packageFormPage.expectSuggestedNameAndSku(
      `${product.name} – 50 szt.`,
      `${product.symbol}-50`,
    );
    await packageFormPage.fillForm({
      weightG: 250,
      asin: 'B0C7654321',
      fnsku: 'X00PWTEST1',
      codeType: 'EAN',
      code: '5901234123457',
    });
    await packageFormPage.save();

    await packagesListPage.forPlatform(platform.id).expectToBeOpened();
    const sku = `${product.symbol}-50`;
    const saved: Package[] = await (
      await packagesApi.list({ productId: product.id })
    ).json();
    packageIds.push(...saved.map((p) => p.id));
    await packagesListPage.search(sku);
    await packagesListPage.expectRow(sku, [
      'B0C7654321',
      'X00PWTEST1',
      '5901234123457',
      '250 g',
      '0 pak.',
    ]);
  });

  test('a package with available stock cannot be deleted', async ({
    packageFormPage,
  }) => {
    const pkg = await readCreated<Package>(
      await packagesApi.create({
        platformId: catalog.platform.id,
        productId: catalog.product.id,
        name: `${catalog.product.name} – 100 szt.`,
        sku: `${catalog.product.symbol}-100`,
        quantity: 100,
      }),
      'package',
    );
    packageIds.push(pkg.id);
    documentIds.push(
      (
        await readCreated<{ id: number }>(
          await documents.create({
            type: 'IN',
            date: today(),
            lines: [{ productId: catalog.product.id, quantity: 200 }],
          }),
          'receipt',
        )
      ).id,
    );

    await packageFormPage.forPackage(catalog.platform.id, pkg.id).open();

    await packageFormPage.expectDeleteBlocked(2);
  });
});

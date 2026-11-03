import { PackagesApi } from '../api/PackagesApi';
import { PlatformsApi } from '../api/PlatformsApi';
import { ProductsApi } from '../api/ProductsApi';
import { Package, Platform, PlatformKind, Product } from '../api/types';
import { buildPackage, buildPlatform, buildProduct } from './factories';
import { APIRequestContext, APIResponse } from '@playwright/test';

// Own platform + product (+ optional package) for tests that need existing data.
// Created in test.beforeAll, removed in test.afterAll with deleteCatalog().
export interface Catalog {
  platform: Platform;
  product: Product;
  pkg?: Package;
}

// kind AMAZON: the package also gets Amazon data (ASIN, FNSKU).
export async function createCatalog(
  request: APIRequestContext,
  options: { withPackage: boolean; kind?: PlatformKind },
): Promise<Catalog> {
  const kind = options.kind ?? 'OTHER';
  const platform = await readCreated<Platform>(
    await new PlatformsApi(request).create(buildPlatform({ kind })),
    'platform',
  );
  const product = await readCreated<Product>(
    await new ProductsApi(request).create(buildProduct()),
    'product',
  );
  const amazon =
    kind === 'AMAZON' ? { asin: 'B0C1234567', fnsku: 'X001ABC123' } : undefined;
  const pkg = options.withPackage
    ? await readCreated<Package>(
        await new PackagesApi(request).create(
          buildPackage(platform.id, product.id, { amazon }),
        ),
        'package',
      )
    : undefined;
  return { platform, product, pkg };
}

// Deletes in dependency order. Missing items (already deleted by a test) are fine.
// `catalog` is undefined when createCatalog() failed in beforeAll – then there is nothing to delete.
export async function deleteCatalog(
  request: APIRequestContext,
  catalog: Catalog | undefined,
): Promise<void> {
  if (!catalog) return;
  if (catalog.pkg) {
    await deleteIgnoringMissing(
      await new PackagesApi(request).delete(catalog.pkg.id),
    );
  }
  await deleteIgnoringMissing(
    await new ProductsApi(request).delete(catalog.product.id),
  );
  await deleteIgnoringMissing(
    await new PlatformsApi(request).delete(catalog.platform.id),
  );
}

// For setup code (hooks), where a failed precondition should stop the tests.
export async function readCreated<T>(
  response: APIResponse,
  what: string,
): Promise<T> {
  if (response.status() !== 201) {
    throw new Error(
      `Could not create ${what}: ${response.status()} ${await response.text()}`,
    );
  }
  return response.json();
}

export async function deleteIgnoringMissing(
  response: APIResponse,
): Promise<void> {
  if (![200, 204, 404].includes(response.status())) {
    throw new Error(
      `Cleanup failed: ${response.status()} ${await response.text()}`,
    );
  }
}

import { AuthApi } from '../api/AuthApi';
import { DocumentsApi } from '../api/DocumentsApi';
import { OrdersApi } from '../api/OrdersApi';
import { PackagesApi } from '../api/PackagesApi';
import { PackingListsApi } from '../api/PackingListsApi';
import { PhotosApi } from '../api/PhotosApi';
import { PlatformsApi } from '../api/PlatformsApi';
import { ProductsApi } from '../api/ProductsApi';
import { SettingsApi } from '../api/SettingsApi';
import { ShipmentsApi } from '../api/ShipmentsApi';
import { TodosApi } from '../api/TodosApi';
import { UsersApi } from '../api/UsersApi';
import {
  createContextWithToken,
  logIn,
  readSavedToken,
} from '../api/apiContext';
import { TestData } from '../test-data/TestData';
import { getTestUser } from '../test-data/users';
import { APIRequestContext, test as base } from '@playwright/test';

type ApiFixtures = {
  // Without a token – the only client for tests of logging in.
  authApi: AuthApi;
  // Logged in as the test user.
  documentsApi: DocumentsApi;
  ordersApi: OrdersApi;
  packagesApi: PackagesApi;
  packingListsApi: PackingListsApi;
  photosApi: PhotosApi;
  platformsApi: PlatformsApi;
  productsApi: ProductsApi;
  settingsApi: SettingsApi;
  shipmentsApi: ShipmentsApi;
  todosApi: TodosApi;
  usersApi: UsersApi;
  // Data of one test, deleted after the test.
  testData: TestData;
};

export type ApiWorkerOptions = {
  // File with a saved session (see playwright.config.ts). When set, API calls
  // reuse its token; otherwise each worker logs in once through the API.
  savedSession: string | undefined;
};

type ApiWorkerFixtures = {
  workerToken: string;
  workerApi: APIRequestContext;
};

export const test = base.extend<
  ApiFixtures,
  ApiWorkerOptions & ApiWorkerFixtures
>({
  savedSession: [undefined, { option: true, scope: 'worker' }],
  workerToken: [
    async ({ playwright, savedSession }, use): Promise<void> => {
      await use(
        savedSession
          ? readSavedToken(savedSession)
          : await logIn(playwright.request, getTestUser()),
      );
    },
    { scope: 'worker' },
  ],
  workerApi: [
    async ({ playwright, workerToken }, use): Promise<void> => {
      const api = await createContextWithToken(playwright.request, workerToken);
      await use(api);
      await api.dispose();
    },
    { scope: 'worker' },
  ],
  // Own timeout: cleanup runs after the test and must not be cut short
  // by the test's 30 s limit (e.g. when the test failed late).
  testData: [
    async ({ workerApi }, use): Promise<void> => {
      const data = new TestData(workerApi);
      await use(data);
      await data.cleanup();
    },
    { timeout: 60_000 },
  ],
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },
  documentsApi: async ({ workerApi }, use) => {
    await use(new DocumentsApi(workerApi));
  },
  ordersApi: async ({ workerApi }, use) => {
    await use(new OrdersApi(workerApi));
  },
  packagesApi: async ({ workerApi }, use) => {
    await use(new PackagesApi(workerApi));
  },
  packingListsApi: async ({ workerApi }, use) => {
    await use(new PackingListsApi(workerApi));
  },
  photosApi: async ({ workerApi }, use) => {
    await use(new PhotosApi(workerApi));
  },
  platformsApi: async ({ workerApi }, use) => {
    await use(new PlatformsApi(workerApi));
  },
  productsApi: async ({ workerApi }, use) => {
    await use(new ProductsApi(workerApi));
  },
  settingsApi: async ({ workerApi }, use) => {
    await use(new SettingsApi(workerApi));
  },
  shipmentsApi: async ({ workerApi }, use) => {
    await use(new ShipmentsApi(workerApi));
  },
  todosApi: async ({ workerApi }, use) => {
    await use(new TodosApi(workerApi));
  },
  usersApi: async ({ workerApi }, use) => {
    await use(new UsersApi(workerApi));
  },
});

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
  CreatePackageRequest,
  CreatePlatformRequest,
  CreateProductRequest,
  CreateUserRequest,
  Document,
  Order,
  Package,
  PackingList,
  PhotoFolder,
  Platform,
  PlatformKind,
  Product,
  Shipment,
  StockMovement,
  Todo,
} from '../api/types';
import { TEST_PREFIX, today, uniqueId } from './factories';
import { deleteIgnoringMissing, readCreated, readList } from './responses';
import { APIRequestContext } from '@playwright/test';

// Platform with a product and its package (100 pcs, 450 g).
export interface Catalog {
  platform: Platform;
  product: Product;
  pkg: Package;
}

export interface CatalogOptions {
  kind?: PlatformKind; // default OTHER
  stock?: number; // pieces received before the test, default 0
}

// Test data of ONE test. Everything gets the same unique prefix, so cleanup()
// also finds what the test itself created (in the UI or with a tested request) –
// tests do not track ids. Names from this class are enough, e.g. `orderName()`.
// Used through the `testData` fixture, which runs cleanup() after the test.
export class TestData {
  readonly prefix = `${TEST_PREFIX}-${uniqueId()}`;
  private counter = 0;
  private usesCatalog = false;
  // Cleanup of things outside the catalog, registered when their name is given out.
  private readonly cleanups: (() => Promise<void>)[] = [];
  private readonly products: ProductsApi;
  private readonly platforms: PlatformsApi;
  private readonly packages: PackagesApi;
  private readonly documents: DocumentsApi;
  private readonly orders: OrdersApi;
  private readonly packingLists: PackingListsApi;
  private readonly shipments: ShipmentsApi;
  private readonly todos: TodosApi;
  private readonly photos: PhotosApi;
  private readonly users: UsersApi;
  private readonly settings: SettingsApi;

  constructor(api: APIRequestContext) {
    this.products = new ProductsApi(api);
    this.platforms = new PlatformsApi(api);
    this.packages = new PackagesApi(api);
    this.documents = new DocumentsApi(api);
    this.orders = new OrdersApi(api);
    this.packingLists = new PackingListsApi(api);
    this.shipments = new ShipmentsApi(api);
    this.todos = new TodosApi(api);
    this.photos = new PhotosApi(api);
    this.users = new UsersApi(api);
    this.settings = new SettingsApi(api);
  }

  // ---------- Unique values ----------

  // Product symbol / package SKU, e.g. "PW-TEST-…-1" (the API stores them in uppercase).
  symbol(): string {
    this.usesCatalog = true;
    return this.label(`-${++this.counter}`);
  }

  // Name of a product, package, platform or packing list, e.g. "PW-TEST-… product".
  name(what: string): string {
    this.usesCatalog = true;
    return this.label(` ${what}`);
  }

  // Shipments have short names (boxes become "<name>-1", "<name>-2"…);
  // they are removed through their platform, so no prefix is needed.
  shipmentName(): string {
    return `PW${uniqueId().slice(-6)}`;
  }

  orderName(): string {
    return this.labelToDelete(
      'order',
      async () => readList<Order>(await this.orders.list(), 'orders'),
      (order) => order.name,
      (order) => this.orders.delete(order.id),
    );
  }

  todoTitle(): string {
    return this.labelToDelete(
      'note',
      async () => readList<Todo>(await this.todos.list(), 'notes'),
      (todo) => todo.title,
      (todo) => this.todos.delete(todo.id),
    );
  }

  // Deleting a folder also deletes its photos.
  folderName(): string {
    return this.labelToDelete(
      'folder',
      async () =>
        readList<PhotoFolder>(await this.photos.listFolders(), 'photo folders'),
      (folder) => folder.name,
      (folder) => this.photos.deleteFolder(folder.id),
    );
  }

  // Own, unique key – never touches the real settings of the test user.
  settingKey(): string {
    const key = `pwtest.${uniqueId()}`;
    this.cleanups.push(async () =>
      deleteIgnoringMissing(await this.settings.delete(key)),
    );
    return key;
  }

  // ---------- Request bodies ----------

  // 42.50 zł net per 1000 pcs, VAT 23%
  productRequest(
    overrides: Partial<CreateProductRequest> = {},
  ): CreateProductRequest {
    return {
      name: this.name('product'),
      symbol: this.symbol(),
      netPricePer1000: 42.5,
      vatRate: 23,
      ...overrides,
    };
  }

  platformRequest(
    overrides: Partial<CreatePlatformRequest> = {},
  ): CreatePlatformRequest {
    return { name: this.name('platform'), kind: 'OTHER', ...overrides };
  }

  // Package of 100 pcs, 450 g
  packageRequest(
    platform: Platform,
    product: Product,
    overrides: Partial<CreatePackageRequest> = {},
  ): CreatePackageRequest {
    return {
      platformId: platform.id,
      productId: product.id,
      name: this.name('package'),
      sku: this.symbol(),
      quantity: 100,
      weightG: 450,
      ...overrides,
    };
  }

  // Usernames: 3–50 chars, lowercase letters, digits, dot, dash, underscore.
  userRequest(overrides: Partial<CreateUserRequest> = {}): CreateUserRequest {
    const username = `pw.test.${uniqueId()}`;
    this.cleanups.push(async () =>
      deleteIgnoringMissing(await this.users.delete(username)),
    );
    return { username, password: 'Password123', ...overrides };
  }

  // ---------- Data created before the test ----------

  async product(
    overrides: Partial<CreateProductRequest> = {},
  ): Promise<Product> {
    return readCreated<Product>(
      await this.products.create(this.productRequest(overrides)),
      'product',
    );
  }

  async platform(kind: PlatformKind = 'OTHER'): Promise<Platform> {
    return readCreated<Platform>(
      await this.platforms.create(this.platformRequest({ kind })),
      'platform',
    );
  }

  // Amazon platforms: the package also gets ASIN B0C1234567 / FNSKU X001ABC123.
  async package(platform: Platform, product: Product): Promise<Package> {
    const amazon =
      platform.kind === 'AMAZON'
        ? { asin: 'B0C1234567', fnsku: 'X001ABC123' }
        : undefined;
    return readCreated<Package>(
      await this.packages.create(
        this.packageRequest(platform, product, { amazon }),
      ),
      'package',
    );
  }

  // Platform + product + package (+ stock).
  async catalog(options: CatalogOptions = {}): Promise<Catalog> {
    const platform = await this.platform(options.kind);
    const product = await this.product();
    const pkg = await this.package(platform, product);
    if (options.stock) await this.receipt(product, options.stock);
    return { platform, product, pkg };
  }

  // Stock receipt (IN document) in pieces.
  async receipt(product: Product, quantity: number): Promise<Document> {
    return readCreated<Document>(
      await this.documents.create({
        type: 'IN',
        date: today(),
        lines: [{ productId: product.id, quantity }],
      }),
      'receipt',
    );
  }

  // Issue (OUT document) in packages.
  async issue(pkg: Package, packages: number): Promise<Document> {
    return readCreated<Document>(
      await this.documents.create({
        type: 'OUT',
        platformId: pkg.platformId,
        date: today(),
        lines: [{ packageId: pkg.id, quantity: packages }],
      }),
      'issue',
    );
  }

  // Order with 10 pcs of the product and 3 packages.
  async order({ product, pkg }: Catalog): Promise<Order> {
    return readCreated<Order>(
      await this.orders.create({
        name: this.orderName(),
        date: today(),
        items: [
          { productId: product.id, quantity: 10 },
          { packageId: pkg.id, quantity: 3 },
        ],
      }),
      'order',
    );
  }

  // Packing list of one platform, the same count of each package.
  async packingList(
    pkgs: Package | Package[],
    packages: number,
  ): Promise<PackingList> {
    const list = [pkgs].flat();
    return readCreated<PackingList>(
      await this.packingLists.create({
        platformId: list[0].platformId,
        name: this.name('packing list'),
        date: today(),
        items: list.map((pkg) => ({
          packageId: pkg.id,
          packageCount: packages,
        })),
      }),
      'packing list',
    );
  }

  // Shipment with one box.
  async shipment(pkg: Package, packages: number): Promise<Shipment> {
    return readCreated<Shipment>(
      await this.shipments.create({
        platformId: pkg.platformId,
        name: this.shipmentName(),
        date: today(),
        boxes: [{ items: [{ packageId: pkg.id, packageCount: packages }] }],
      }),
      'shipment',
    );
  }

  // Note with two open items: the package and a SKU without a package.
  async todo({ platform, pkg }: Catalog): Promise<Todo> {
    return readCreated<Todo>(
      await this.todos.create({
        title: this.todoTitle(),
        date: today(),
        platformId: platform.id,
        items: [{ sku: pkg.sku }, { sku: 'PW-TEST-NO-PACKAGE' }],
      }),
      'note',
    );
  }

  async photoFolder(): Promise<PhotoFolder> {
    return readCreated<PhotoFolder>(
      await this.photos.createFolder({ name: this.folderName() }),
      'photo folder',
    );
  }

  async user(): Promise<CreateUserRequest> {
    const user = this.userRequest();
    await readCreated(await this.users.create(user), 'user');
    return user;
  }

  // ---------- Current state ----------

  async stockOf(product: Product): Promise<number> {
    const current: Product = await (await this.products.get(product.id)).json();
    return current.stock;
  }

  async productExists(product: Product): Promise<boolean> {
    return (await this.products.get(product.id)).status() === 200;
  }

  // ---------- Cleanup ----------

  // Deletes everything with this test's prefix, in dependency order.
  // A failed step does not stop the next ones.
  async cleanup(): Promise<void> {
    const steps = [...this.cleanups];
    if (this.usesCatalog) steps.push(() => this.deleteCatalog());

    const errors: unknown[] = [];
    for (const step of steps) {
      try {
        await step();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) throw new Error(errors.map(String).join('\n'));
  }

  private label(suffix: string): string {
    return `${this.prefix}${suffix}`;
  }

  // Unique name of a thing that cleanup() finds on its list by that name.
  private labelToDelete<T>(
    what: string,
    list: () => Promise<T[]>,
    nameOf: (item: T) => string,
    remove: (item: T) => ReturnType<OrdersApi['delete']>,
  ): string {
    const label = this.label(` ${what} ${++this.counter}`);
    this.cleanups.push(async () => {
      for (const item of await list()) {
        if (nameOf(item) === label) {
          await deleteIgnoringMissing(await remove(item));
        }
      }
    });
    return label;
  }

  private async deleteCatalog(): Promise<void> {
    const platforms = (
      await readList<Platform>(await this.platforms.list(), 'platforms')
    ).filter((p) => p.name.startsWith(this.prefix));
    const products = (
      await readList<Product>(await this.products.list(), 'products')
    ).filter((p) => p.symbol.startsWith(this.prefix));

    for (const platform of platforms) {
      await this.deleteAll(this.shipments, platform.id);
      await this.deleteAll(this.packingLists, platform.id);
    }
    // Issues first, then receipts – stock never stays negative.
    for (const documentId of await this.documentIdsOf(products)) {
      await deleteIgnoringMissing(await this.documents.delete(documentId));
    }
    for (const product of products) {
      const packages = await readList<Package>(
        await this.packages.list({ productId: product.id }),
        'packages',
      );
      for (const pkg of packages) {
        await deleteIgnoringMissing(await this.packages.delete(pkg.id));
      }
      await deleteIgnoringMissing(await this.products.delete(product.id));
    }
    for (const platform of platforms) {
      await deleteIgnoringMissing(await this.platforms.delete(platform.id));
    }
  }

  private async deleteAll(
    resource: ShipmentsApi | PackingListsApi,
    platformId: number,
  ): Promise<void> {
    const items = await readList<{ id: number }>(
      await resource.list({ platformId }),
      'shipments / packing lists',
    );
    for (const item of items) {
      await deleteIgnoringMissing(await resource.delete(item.id));
    }
  }

  // Ids of documents that moved stock of the given products, issues (OUT) first.
  // Read from each product's stock history – no need to scan all documents.
  private async documentIdsOf(products: Product[]): Promise<number[]> {
    const issues = new Set<number>();
    const receipts = new Set<number>();
    for (const product of products) {
      const movements = await readList<StockMovement>(
        await this.products.movements(product.id),
        'stock movements',
      );
      for (const movement of movements) {
        (movement.type === 'OUT' ? issues : receipts).add(movement.documentId);
      }
    }
    return [...issues, ...receipts];
  }
}

import { DocumentsApi } from '../api/DocumentsApi';
import { PackagesApi } from '../api/PackagesApi';
import { PackingListsApi } from '../api/PackingListsApi';
import { PlatformsApi } from '../api/PlatformsApi';
import { ProductsApi } from '../api/ProductsApi';
import { ShipmentsApi } from '../api/ShipmentsApi';
import {
  Document,
  Package,
  Platform,
  PlatformKind,
  Product,
  StockMovement,
} from '../api/types';
import { deleteIgnoringMissing, readCreated } from './catalog';
import { TEST_PREFIX, today, uniqueId } from './factories';
import { APIRequestContext } from '@playwright/test';

// Data that a UI test needs before it starts, created through the API.
export interface UiCatalog {
  platform: Platform;
  product: Product;
  pkg: Package;
}

export interface CatalogOptions {
  kind?: PlatformKind; // default OTHER
  stock?: number; // pieces received before the test, default 0
}

// Test data of ONE test. Everything gets the same unique prefix, so cleanup()
// also finds what the test created through the UI (products, packages,
// documents, packing lists, shipments) – tests do not track ids themselves.
// Used through the `testData` fixture, which runs cleanup() after the test.
export class UiTestData {
  readonly prefix = `${TEST_PREFIX}-${uniqueId()}`;
  private counter = 0;
  private readonly products: ProductsApi;
  private readonly platforms: PlatformsApi;
  private readonly packages: PackagesApi;
  private readonly documents: DocumentsApi;

  constructor(private readonly api: APIRequestContext) {
    this.products = new ProductsApi(api);
    this.platforms = new PlatformsApi(api);
    this.packages = new PackagesApi(api);
    this.documents = new DocumentsApi(api);
  }

  // Unique values with the test prefix, e.g. "PW-TEST-…-1", "PW-TEST-… product".
  symbol(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }

  name(label: string): string {
    return `${this.prefix} ${label}`;
  }

  // Shipments have short names (boxes become "<name>-1", "<name>-2"…);
  // they are removed through their platform, so no prefix is needed.
  shipmentName(): string {
    return `PW${uniqueId().slice(-6)}`;
  }

  // 42.50 zł net per 1000 pcs, VAT 23%
  async product(): Promise<Product> {
    return readCreated<Product>(
      await this.products.create({
        name: this.name('product'),
        symbol: this.symbol(),
        netPricePer1000: 42.5,
        vatRate: 23,
      }),
      'product',
    );
  }

  async platform(kind: PlatformKind = 'OTHER'): Promise<Platform> {
    return readCreated<Platform>(
      await this.platforms.create({ name: this.name('platform'), kind }),
      'platform',
    );
  }

  // Package of 100 pcs, 450 g; Amazon platforms also get ASIN B0C1234567 / FNSKU X001ABC123.
  async package(platform: Platform, product: Product): Promise<Package> {
    return readCreated<Package>(
      await this.packages.create({
        platformId: platform.id,
        productId: product.id,
        name: this.name('package'),
        sku: this.symbol(),
        quantity: 100,
        weightG: 450,
        amazon:
          platform.kind === 'AMAZON'
            ? { asin: 'B0C1234567', fnsku: 'X001ABC123' }
            : undefined,
      }),
      'package',
    );
  }

  // Stock receipt (IN document) for a product.
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

  // Platform + product + package (+ stock).
  async catalog(options: CatalogOptions = {}): Promise<UiCatalog> {
    const platform = await this.platform(options.kind);
    const product = await this.product();
    const pkg = await this.package(platform, product);
    if (options.stock) await this.receipt(product, options.stock);
    return { platform, product, pkg };
  }

  async stockOf(product: Product): Promise<number> {
    const current: Product = await (await this.products.get(product.id)).json();
    return current.stock;
  }

  async productExists(product: Product): Promise<boolean> {
    return (await this.products.get(product.id)).status() === 200;
  }

  // The product created through the UI form, found by its unique symbol.
  async productBySymbol(symbol: string): Promise<Product> {
    const all: Product[] = await (await this.products.list()).json();
    const product = all.find((p) => p.symbol === symbol);
    if (!product) throw new Error(`Product ${symbol} not found`);
    return product;
  }

  // Deletes everything with this test's prefix, in dependency order.
  async cleanup(): Promise<void> {
    const platforms = (
      (await (await this.platforms.list()).json()) as Platform[]
    ).filter((p) => p.name.startsWith(this.prefix));
    const products = (
      (await (await this.products.list()).json()) as Product[]
    ).filter((p) => p.symbol.startsWith(this.prefix));

    for (const platform of platforms) {
      await this.deleteAll(new ShipmentsApi(this.api), platform.id);
      await this.deleteAll(new PackingListsApi(this.api), platform.id);
    }
    // Issues first, then receipts – stock never stays negative.
    for (const documentId of await this.documentIdsOf(products)) {
      await deleteIgnoringMissing(await this.documents.delete(documentId));
    }
    for (const product of products) {
      const packages: Package[] = await (
        await this.packages.list({ productId: product.id })
      ).json();
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
    const items: { id: number }[] = await (
      await resource.list({ platformId })
    ).json();
    for (const item of items) {
      await deleteIgnoringMissing(await resource.delete(item.id));
    }
  }

  // Documents with lines of the given products, issues (OUT) first.
  // Ids of documents that moved stock of the given products, issues (OUT) first.
  // Read from each product's stock history – no need to scan all documents.
  private async documentIdsOf(products: Product[]): Promise<number[]> {
    const issues = new Set<number>();
    const receipts = new Set<number>();
    for (const product of products) {
      const movements: StockMovement[] = await (
        await this.products.movements(product.id)
      ).json();
      for (const movement of movements) {
        (movement.type === 'OUT' ? issues : receipts).add(movement.documentId);
      }
    }
    return [...issues, ...receipts];
  }
}

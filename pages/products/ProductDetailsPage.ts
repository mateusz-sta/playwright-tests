import { AuthenticatedPage } from '../AuthenticatedPage';
import { CalculatedPrices } from './ProductFormPage';
import { Locator, Page, expect } from '@playwright/test';

// Product card: /products/{id} – prices, stock, packages and stock history.
export class ProductDetailsPage extends AuthenticatedPage {
  private productId = 0;
  readonly heading: Locator;
  readonly stock: Locator;
  readonly editLink: Locator;
  readonly deleteButton: Locator;
  readonly history: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    // Label and value are separate elements – use their common parent.
    this.stock = page
      .getByText('Stan magazynowy', { exact: true })
      .locator('..');
    this.editLink = page.getByRole('link', { name: 'Edytuj' });
    this.deleteButton = page.getByRole('button', { name: 'Usuń' });
    // Entries of "Historia ruchów", e.g. "Przyjęcie +250 szt. 22.11.2026 · …"
    this.history = page
      .getByRole('main')
      .getByRole('listitem')
      .filter({ hasText: /^(Przyjęcie|Wydanie) [+-]/ });
  }

  get path(): string {
    return `/products/${this.productId}`;
  }

  forProduct(id: number): this {
    this.productId = id;
    return this;
  }

  // Reads the product id from the URL after the form redirected here.
  async rememberIdFromUrl(): Promise<number> {
    await expect(this.page).toHaveURL(/\/products\/\d+$/);
    this.productId = Number(this.page.url().match(/\/products\/(\d+)$/)?.[1]);
    return this.productId;
  }

  async expectToBeOpened(): Promise<void> {
    await super.expectToBeOpened();
    await expect(this.heading).toBeVisible();
  }

  async expectProduct(name: string, symbol: string): Promise<void> {
    await expect(this.heading).toHaveText(name);
    await expect(this.page.getByRole('main').getByText(symbol)).toBeVisible();
  }

  async expectStock(stock: string): Promise<void> {
    await expect(this.stock).toHaveText(
      new RegExp(`^Stan magazynowy\\s*${stock.replace(' ', '\\s')}$`),
    );
  }

  async expectPrices(prices: CalculatedPrices): Promise<void> {
    await expect(this.definition('Za 1000 szt. netto')).toHaveText(
      prices.per1000Net,
    );
    await expect(this.definition('Za 1000 szt. brutto')).toHaveText(
      prices.per1000Gross,
    );
    await expect(this.definition('Cena jedn. netto')).toHaveText(
      prices.unitNet,
    );
    await expect(this.definition('Cena jedn. brutto')).toHaveText(
      prices.unitGross,
    );
  }

  // e.g. "Przyjęcie +250 szt."
  async expectHistoryEntry(text: string): Promise<void> {
    await expect(this.history.filter({ hasText: text })).toHaveCount(1);
  }

  async delete(productName: string): Promise<void> {
    await this.clickAndConfirm(
      this.deleteButton,
      new RegExp(`Usunąć produkt „${productName}”`),
    );
  }
}

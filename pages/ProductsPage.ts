import { AuthenticatedPage } from './AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

export class ProductsPage extends AuthenticatedPage {
  readonly path = '/products';
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly resultsCount: Locator;
  readonly newProductLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Produkty', level: 1 });
    this.searchInput = page.getByRole('searchbox', { name: 'Szukaj' });
    this.resultsCount = page.getByRole('status').filter({ hasText: 'Wyniki' });
    this.newProductLink = page.getByRole('link', { name: '+ Nowy produkt' });
  }

  async expectToBeOpened(): Promise<void> {
    await super.expectToBeOpened();
    await expect(this.heading).toBeVisible();
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  // Table row of a product, found by its symbol.
  row(symbol: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: symbol, exact: true }),
    });
  }

  async expectResults(count: number): Promise<void> {
    await expect(this.resultsCount).toHaveText(`Wyniki: ${count}`);
  }

  async expectRow(symbol: string, cells: string[]): Promise<void> {
    const row = this.row(symbol);
    await expect(row).toBeVisible();
    for (const cell of cells) {
      await expect(
        row.getByRole('cell', { name: cell, exact: true }),
      ).toBeVisible();
    }
  }

  async openProduct(name: string): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).click();
  }
}

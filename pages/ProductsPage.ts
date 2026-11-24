import { SearchBar } from '../components/SearchBar';
import { AuthenticatedPage } from './AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

export class ProductsPage extends AuthenticatedPage {
  readonly path = '/products';
  readonly heading: Locator;
  readonly searchBar: SearchBar;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Produkty', level: 1 });
    this.searchBar = new SearchBar(page);
  }

  async expectToBeOpened(): Promise<void> {
    await super.expectToBeOpened();
    await expect(this.heading).toBeVisible();
  }

  // Table row of a product, found by its symbol.
  row(symbol: string): Locator {
    return this.rowWithCell(symbol);
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
}

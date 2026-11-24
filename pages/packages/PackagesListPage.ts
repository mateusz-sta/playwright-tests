import { SearchBar } from '../../components/SearchBar';
import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// Packages of a platform: /platforms/{platformId}/packages
export class PackagesListPage extends AuthenticatedPage {
  private platformId = 0;
  readonly heading: Locator;
  readonly searchBar: SearchBar;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Pakiety', level: 1 });
    this.searchBar = new SearchBar(page);
  }

  get path(): string {
    return `/platforms/${this.platformId}/packages`;
  }

  forPlatform(platformId: number): this {
    this.platformId = platformId;
    return this;
  }

  async expectToBeOpened(): Promise<void> {
    await super.expectToBeOpened();
    await expect(this.heading).toBeVisible();
  }

  row(sku: string): Locator {
    return this.rowWithCell(sku);
  }

  // texts expected in the row, e.g. ['B0C1234567', '2 pak.']
  // (some cells add a label, e.g. "EAN 5901234123457", so this checks the row text)
  async expectRow(sku: string, texts: string[]): Promise<void> {
    const row = this.row(sku);
    await expect(row).toBeVisible();
    for (const text of texts) {
      await expect(row).toContainText(text);
    }
  }
}

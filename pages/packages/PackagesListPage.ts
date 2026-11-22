import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// Packages of a platform: /platforms/{platformId}/packages
export class PackagesListPage extends AuthenticatedPage {
  private platformId = 0;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly resultsCount: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Pakiety', level: 1 });
    this.searchInput = page.getByRole('searchbox', { name: 'Szukaj' });
    this.resultsCount = page.getByRole('status').filter({ hasText: 'Wyniki' });
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

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  row(sku: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: sku, exact: true }) });
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

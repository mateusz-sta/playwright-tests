import { LineItemInput } from '../../components/LineItemInput';
import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// "Nowa lista pakowania": /platforms/{platformId}/packing/new
export class PackingListFormPage extends AuthenticatedPage {
  private platformId = 0;
  readonly nameInput: Locator;
  readonly lines: LineItemInput;
  readonly summary: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Nazwa / numer listy');
    this.lines = new LineItemInput(
      page,
      'Dodaj pakiet',
      'Ilość paczek',
      'suggest',
    );
    // Text starts with whitespace (Angular template), hence \s*.
    this.summary = page
      .getByRole('paragraph')
      .filter({ hasText: /^\s*Pozycje:/ });
    this.saveButton = page.getByRole('button', { name: 'Zapisz listę' });
  }

  get path(): string {
    return `/platforms/${this.platformId}/packing/new`;
  }

  forPlatform(platformId: number): this {
    this.platformId = platformId;
    return this;
  }

  async addPackage(sku: string, count: number): Promise<void> {
    await this.lines.add(sku, count);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  // Row of a package with units needed and the product's current stock.
  async expectLine(sku: string, units: string, stock: string): Promise<void> {
    const row = this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: sku, exact: true }) });
    await expect(
      row.getByRole('cell', { name: units, exact: true }),
    ).toBeVisible();
    await expect(
      row.getByRole('cell', { name: stock, exact: true }),
    ).toBeVisible();
  }

  // e.g. "Pozycje: 1 · paczki: 2 · sztuki produktów: 200"
  async expectSummary(text: string): Promise<void> {
    await expect(this.summary).toHaveText(text);
  }
}

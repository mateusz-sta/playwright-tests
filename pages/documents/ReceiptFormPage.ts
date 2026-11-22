import { LineItemInput } from '../../components/LineItemInput';
import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// "Nowe przyjęcie" – /documents/in/new: products in, stock goes up.
export class ReceiptFormPage extends AuthenticatedPage {
  readonly path = '/documents/in/new';
  readonly invoiceInput: Locator;
  readonly supplierInput: Locator;
  readonly lines: LineItemInput;
  readonly summary: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.invoiceInput = page.getByLabel('Numer faktury (opcjonalnie)');
    this.supplierInput = page.getByLabel('Dostawca (opcjonalnie)');
    this.lines = new LineItemInput(page, 'Symbol produktu', 'Ilość', 'exact');
    // Text starts with whitespace (Angular template), hence \s*.
    this.summary = page
      .getByRole('paragraph')
      .filter({ hasText: /^\s*Razem:/ });
    this.submitButton = page.getByRole('button', { name: 'Przyjmij na stan' });
  }

  async addProduct(symbol: string, quantity: number): Promise<void> {
    await this.lines.add(symbol, quantity);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  // e.g. "Razem: 1 poz. · 250 szt."
  async expectSummary(text: string): Promise<void> {
    await expect(this.summary).toHaveText(text);
  }
}

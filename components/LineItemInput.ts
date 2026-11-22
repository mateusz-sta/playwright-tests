import { Locator, Page, expect } from '@playwright/test';

// "Add item" row of document, list and shipment forms: a picker combobox + quantity.
// Two picker variants exist in the app:
// - 'exact': the value must be typed exactly (receipts, issues),
// - 'suggest': typing shows suggestions, Enter picks the highlighted one.
export class LineItemInput {
  readonly picker: Locator;
  readonly quantity: Locator;
  readonly addButton: Locator;
  private readonly options: Locator;

  constructor(
    page: Page,
    pickerLabel: string,
    quantityLabel: string | RegExp,
    private readonly mode: 'exact' | 'suggest',
  ) {
    this.picker = page.getByRole('combobox', {
      name: pickerLabel,
      exact: true,
    });
    this.quantity = page.getByRole('spinbutton', {
      name: quantityLabel,
      exact: true,
    });
    this.addButton = page.getByRole('button', { name: 'Dodaj', exact: true });
    this.options = page.getByRole('option');
  }

  async add(value: string, quantity: number): Promise<void> {
    await this.picker.fill(value);
    if (this.mode === 'suggest') {
      // Suggestions are loaded from the API (slow on a cold app) – wait before picking.
      await expect(this.options.filter({ hasText: value }).first()).toBeVisible(
        { timeout: 15_000 },
      );
      await this.picker.press('Enter');
    }
    await this.quantity.fill(String(quantity));
    await this.addButton.click();
  }
}

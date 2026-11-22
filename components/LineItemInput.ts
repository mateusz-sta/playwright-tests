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
    if (this.mode === 'suggest') {
      // Suggestions come from the API. Sometimes (e.g. right after "+ Pudełko")
      // the list does not open for the typed text – then clear and type again.
      await expect(async () => {
        await this.picker.fill('');
        await this.picker.fill(value);
        await expect(
          this.options.filter({ hasText: value }).first(),
        ).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 30_000 });
      await this.picker.press('Enter');
      await this.quantity.fill(String(quantity));
      await this.addButton.click();
    } else {
      // The typed value is checked against products/packages loaded from the API.
      // Before they load the app rejects it ("Wybierz … z listy") – then try again.
      // An accepted item is added to the list and the picker is cleared.
      await expect(async () => {
        await this.picker.fill(value);
        await this.quantity.fill(String(quantity));
        await this.addButton.click();
        await expect(this.picker).toHaveValue('', { timeout: 3_000 });
      }).toPass({ timeout: 30_000 });
    }
  }
}

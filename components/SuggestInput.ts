import { Locator, Page, expect } from '@playwright/test';

// Combobox that suggests values while typing; Enter picks the highlighted one.
export class SuggestInput {
  private readonly options: Locator;

  constructor(
    page: Page,
    readonly input: Locator,
  ) {
    this.options = page.getByRole('option');
  }

  // Suggestions come from the API. Sometimes (e.g. right after "+ Pudełko")
  // the list does not open for the typed text – then clear and type again.
  async pick(value: string): Promise<void> {
    await expect(async () => {
      await this.input.fill('');
      await this.input.fill(value);
      await expect(this.options.filter({ hasText: value }).first()).toBeVisible(
        { timeout: 5_000 },
      );
    }).toPass({ timeout: 30_000 });
    await this.input.press('Enter');
  }
}

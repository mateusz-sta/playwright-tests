import { Locator, Page, expect } from '@playwright/test';

// Search field with the number of results above a list.
export class SearchBar {
  readonly input: Locator;
  readonly resultsCount: Locator;

  constructor(page: Page) {
    this.input = page.getByRole('searchbox', { name: 'Szukaj' });
    this.resultsCount = page.getByRole('status').filter({ hasText: 'Wyniki' });
  }

  async search(text: string): Promise<void> {
    await this.input.fill(text);
  }

  async expectResults(count: number): Promise<void> {
    await expect(this.resultsCount).toHaveText(`Wyniki: ${count}`);
  }
}

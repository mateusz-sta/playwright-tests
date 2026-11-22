import { Locator, Page, expect } from '@playwright/test';

export abstract class BasePage {
  // Abstract getter (not a field), so pages can use either a fixed value
  // (`readonly path = '/login'`) or a getter built from ids (`get path()`).
  abstract get path(): string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async expectToBeOpened(): Promise<void> {
    await expect(this.page).toHaveURL(this.urlPattern());
  }

  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  // Value shown next to a label in a description list, e.g. "Data" → "22.11.2026".
  protected definition(term: string): Locator {
    return this.page
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${term}$`) })
      .locator('xpath=following-sibling::dd[1]');
  }

  // The app confirms deletes with the browser's native confirm() dialog.
  protected async clickAndConfirm(
    button: Locator,
    expectedMessage: RegExp,
  ): Promise<void> {
    const dialogShown = this.page.waitForEvent('dialog');
    const clicked = button.click();
    const dialog = await dialogShown;
    const message = dialog.message();
    await dialog.accept();
    await clicked;
    expect(message).toMatch(expectedMessage);
  }

  // Matches the page path with or without a query string, e.g. /login?returnUrl=...
  private urlPattern(): RegExp {
    const escapedPath = this.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escapedPath}(\\?.*)?$`);
  }
}

import { Page, expect } from '@playwright/test';

export abstract class BasePage {
  abstract readonly path: string;

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

  // Matches the page path with or without a query string, e.g. /login?returnUrl=...
  private urlPattern(): RegExp {
    const escapedPath = this.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escapedPath}(\\?.*)?$`);
  }
}

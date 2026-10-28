import { AuthenticatedPage } from './AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

export class ProductsPage extends AuthenticatedPage {
  readonly path = '/products';
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Produkty', level: 1 });
  }

  async expectToBeOpened(): Promise<void> {
    await super.expectToBeOpened();
    await expect(this.heading).toBeVisible();
  }
}

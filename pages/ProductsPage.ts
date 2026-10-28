import { BasePage } from './BasePage';
import { Locator, Page } from '@playwright/test';

export class ProductsPage extends BasePage {
  protected readonly path = '/products';
  readonly heading: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Produkty', level: 1 });
    this.logoutButton = page.getByRole('button', { name: 'Wyloguj' });
  }

  accountLink(username: string): Locator {
    return this.page.getByRole('link', { name: username, exact: true });
  }
}

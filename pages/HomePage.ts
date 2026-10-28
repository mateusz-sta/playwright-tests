import { BasePage } from './BasePage';
import { Locator, Page } from '@playwright/test';

export class HomePage extends BasePage {
  protected readonly path = '/';
  readonly body: Locator;

  constructor(page: Page) {
    super(page);
    this.body = page.locator('body');
  }
}

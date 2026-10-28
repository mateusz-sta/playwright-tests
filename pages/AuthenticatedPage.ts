import { Header } from '../components/Header';
import { BasePage } from './BasePage';
import { Page } from '@playwright/test';

// Base for pages available only after logging in.
export abstract class AuthenticatedPage extends BasePage {
  readonly header: Header;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
  }
}

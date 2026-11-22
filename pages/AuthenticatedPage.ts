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

  // Saves the logged-in session (cookies + localStorage – the app keeps its
  // session in localStorage) so other tests can start already logged in.
  async saveSession(path: string): Promise<void> {
    await this.page.context().storageState({ path });
  }
}

import { Locator, Page, expect } from '@playwright/test';

// Top bar shown on every page after logging in.
export class Header {
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.logoutButton = page.getByRole('button', { name: 'Wyloguj' });
  }

  // The app stores usernames in lowercase, regardless of how they were typed.
  accountLink(username: string): Locator {
    return this.page.getByRole('link', {
      name: username.toLowerCase(),
      exact: true,
    });
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async expectLoggedInAs(username: string): Promise<void> {
    await expect(this.accountLink(username)).toBeVisible();
  }
}

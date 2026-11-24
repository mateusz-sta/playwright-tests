import { User } from '../test-data/users';
import { SESSION_STORAGE_KEY } from '../utils/constants';
import { BasePage } from './BasePage';
import { Locator, Page, expect } from '@playwright/test';

export class LoginPage extends BasePage {
  readonly path = '/login';
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Logowanie' });
    this.usernameInput = page.getByLabel('Login');
    this.passwordInput = page.getByLabel('Hasło');
    this.submitButton = page.getByRole('button', { name: 'Zaloguj' });
    this.errorAlert = page.getByRole('alert');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAs(user: User): Promise<void> {
    await this.login(user.username, user.password);
  }

  async expectToBeOpened(): Promise<void> {
    await super.expectToBeOpened();
    await expect(this.heading).toBeVisible();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorAlert).toHaveText(message);
  }

  // The session is really gone (the app keeps it in localStorage) and the
  // login page stays open – not only shown for a moment.
  async expectToStayLoggedOut(): Promise<void> {
    await expect
      .poll(() =>
        this.page.evaluate(
          (key) => localStorage.getItem(key),
          SESSION_STORAGE_KEY,
        ),
      )
      .toBeNull();
    await this.expectToBeOpened();
  }

  async expectRedirectedFrom(path: string): Promise<void> {
    await expect(this.page).toHaveURL(
      `${this.path}?returnUrl=${encodeURIComponent(path)}`,
    );
    await expect(this.heading).toBeVisible();
  }
}

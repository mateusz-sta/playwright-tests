import { User } from '../test-data/users';
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

  async expectRedirectedFrom(path: string): Promise<void> {
    await expect(this.page).toHaveURL(
      `${this.path}?returnUrl=${encodeURIComponent(path)}`,
    );
    await expect(this.heading).toBeVisible();
  }
}

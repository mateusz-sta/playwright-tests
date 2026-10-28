import { BasePage } from './BasePage';
import { Locator, Page } from '@playwright/test';

export class LoginPage extends BasePage {
  protected readonly path = '/login';
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
}

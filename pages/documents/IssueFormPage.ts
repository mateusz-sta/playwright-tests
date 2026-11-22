import { LineItemInput } from '../../components/LineItemInput';
import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// "Nowe wydanie" – /documents/out/new: packages out to one platform, stock goes down.
export class IssueFormPage extends AuthenticatedPage {
  readonly path = '/documents/out/new';
  readonly platformSelect: Locator;
  readonly lines: LineItemInput;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.platformSelect = page.getByRole('combobox', {
      name: 'Platforma',
      exact: true,
    });
    // The quantity label changes to "Pakietów" once the SKU is recognized.
    this.lines = new LineItemInput(
      page,
      'SKU pakietu',
      /^(Ilość|Pakietów)$/,
      'exact',
    );
    this.submitButton = page.getByRole('button', { name: 'Wydaj ze stanu' });
  }

  async selectPlatform(name: string): Promise<void> {
    await this.platformSelect.selectOption({ label: name });
    // Packages of the platform load after the change.
    await expect(this.lines.picker).toBeEnabled();
  }

  async addPackage(sku: string, count: number): Promise<void> {
    await this.lines.add(sku, count);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}

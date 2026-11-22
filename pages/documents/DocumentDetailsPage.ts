import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// Receipt or issue document: /documents/{id}.
export class DocumentDetailsPage extends AuthenticatedPage {
  private documentId = 0;
  readonly heading: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.deleteButton = page.getByRole('button', { name: 'Usuń dokument' });
  }

  get path(): string {
    return `/documents/${this.documentId}`;
  }

  // Reads the document id from the URL after a form redirected here.
  async rememberIdFromUrl(): Promise<number> {
    await expect(this.page).toHaveURL(/\/documents\/\d+$/);
    this.documentId = Number(this.page.url().match(/\/documents\/(\d+)$/)?.[1]);
    return this.documentId;
  }

  line(code: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: code, exact: true }),
    });
  }

  // type: "Przyjęcie" or "Wydanie"; lines: number of positions
  async expectDocument(type: string, lines: number): Promise<void> {
    await expect(
      this.page.getByRole('main').getByText(type, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: `Pozycje (${lines})` }),
    ).toBeVisible();
  }

  async expectLine(code: string, quantity: string): Promise<void> {
    await expect(this.line(code)).toContainText(quantity);
  }

  // Deleting reverts the stock movements of the document.
  async delete(): Promise<void> {
    await this.clickAndConfirm(
      this.deleteButton,
      /Stany produktów zostaną cofnięte/,
    );
  }
}

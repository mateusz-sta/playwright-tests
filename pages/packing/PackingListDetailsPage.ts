import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// Packing list: /platforms/{platformId}/packing/{id} – items with status "W trakcie" / "Gotowe".
export class PackingListDetailsPage extends AuthenticatedPage {
  private platformId = 0;
  private listId = 0;
  readonly heading: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.deleteButton = page.getByRole('button', { name: 'Usuń', exact: true });
  }

  get path(): string {
    return `/platforms/${this.platformId}/packing/${this.listId}`;
  }

  // Reads platform and list ids from the URL after the form redirected here.
  async rememberIdFromUrl(): Promise<number> {
    const pattern = /\/platforms\/(\d+)\/packing\/(\d+)$/;
    await expect(this.page).toHaveURL(pattern);
    const [, platformId, listId] = this.page.url().match(pattern) ?? [];
    this.platformId = Number(platformId);
    this.listId = Number(listId);
    return this.listId;
  }

  // Status toggle of one item; its text is the current status.
  itemStatus(sku: string): Locator {
    return this.page.getByRole('button', {
      name: `Gotowe: ${sku}`,
      exact: true,
    });
  }

  async toggleItem(sku: string): Promise<void> {
    await this.itemStatus(sku).click();
  }

  async expectName(name: string): Promise<void> {
    await expect(this.heading).toHaveText(name);
  }

  async expectItemStatus(
    sku: string,
    status: 'W trakcie' | 'Gotowe',
  ): Promise<void> {
    await expect(this.itemStatus(sku)).toHaveText(status);
  }

  // Progress while items are open, e.g. "Gotowe 0 z 2"
  async expectProgress(done: number, total: number): Promise<void> {
    await expect(this.definition('Postęp')).toHaveText(
      `Gotowe ${done} z ${total}`,
    );
  }

  // When all items are done the progress says "Gotowa".
  async expectListDone(): Promise<void> {
    await expect(this.definition('Postęp')).toHaveText('Gotowa');
  }

  // e.g. "2 paczek · 200 szt. produktów"
  async expectTotal(text: string): Promise<void> {
    await expect(this.definition('Razem')).toHaveText(text);
  }
}

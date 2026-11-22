import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// Shipment: /platforms/{platformId}/shipments/{id}. Saving a shipment creates an issue document.
export class ShipmentDetailsPage extends AuthenticatedPage {
  private platformId = 0;
  private shipmentId = 0;
  readonly heading: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.deleteButton = page.getByRole('button', { name: 'Usuń', exact: true });
  }

  get path(): string {
    return `/platforms/${this.platformId}/shipments/${this.shipmentId}`;
  }

  // Reads platform and shipment ids from the URL after the form redirected here.
  async rememberIdFromUrl(): Promise<number> {
    const pattern = /\/platforms\/(\d+)\/shipments\/(\d+)$/;
    await expect(this.page).toHaveURL(pattern);
    const [, platformId, shipmentId] = this.page.url().match(pattern) ?? [];
    this.platformId = Number(platformId);
    this.shipmentId = Number(shipmentId);
    return this.shipmentId;
  }

  issueLink(shipmentName: string): Locator {
    return this.page.getByRole('link', { name: `Wydanie ${shipmentName}` });
  }

  async expectShipment(
    name: string,
    totals: { boxes: number; packages: number; units: string },
  ): Promise<void> {
    await expect(this.heading).toHaveText(`Wysyłka ${name}`);
    await expect(this.definition('Pudełka')).toHaveText(String(totals.boxes));
    await expect(this.definition('Pakiety')).toHaveText(
      String(totals.packages),
    );
    await expect(this.definition('Sztuk produktów')).toHaveText(totals.units);
    await expect(this.issueLink(name)).toBeVisible();
  }

  // Deleting the shipment also deletes its issue – stock goes back.
  async delete(): Promise<void> {
    await this.clickAndConfirm(this.deleteButton, /Usunąć/);
  }
}

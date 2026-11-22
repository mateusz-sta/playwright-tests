import { LineItemInput } from '../../components/LineItemInput';
import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

// "Nowa wysyłka": /platforms/{platformId}/shipments/new – packages in boxes.
// Packages are added to the selected box ("Dodajesz do: …").
export class ShipmentFormPage extends AuthenticatedPage {
  private platformId = 0;
  readonly nameInput: Locator;
  readonly addBoxButton: Locator;
  readonly lines: LineItemInput;
  readonly summary: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Nazwa wysyłki');
    this.addBoxButton = page.getByRole('button', { name: '+ Pudełko' });
    this.lines = new LineItemInput(
      page,
      'Dodaj pakiet',
      'Ilość paczek',
      'suggest',
    );
    // Text starts with whitespace (Angular template), hence \s*.
    this.summary = page
      .getByRole('paragraph')
      .filter({ hasText: /^\s*Pudełka:/ });
    this.saveButton = page.getByRole('button', { name: 'Zapisz wysyłkę' });
  }

  get path(): string {
    return `/platforms/${this.platformId}/shipments/new`;
  }

  forPlatform(platformId: number): this {
    this.platformId = platformId;
    return this;
  }

  // Box region, e.g. "R158-1"
  box(label: string): Locator {
    return this.page.getByRole('region', { name: label, exact: true });
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async addBox(): Promise<void> {
    await this.addBoxButton.click();
  }

  async addPackage(sku: string, count: number): Promise<void> {
    await this.lines.add(sku, count);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  // Packages in a box: "Ilość pakietów: <sku>" spinbutton
  async expectInBox(label: string, sku: string, count: number): Promise<void> {
    await expect(
      this.box(label).getByRole('spinbutton', {
        name: `Ilość pakietów: ${sku}`,
      }),
    ).toHaveValue(String(count));
  }

  // e.g. "Pudełka: 2 · pakiety: 3 · ~1,4 kg"
  async expectSummary(text: string): Promise<void> {
    await expect(this.summary).toHaveText(text);
  }
}

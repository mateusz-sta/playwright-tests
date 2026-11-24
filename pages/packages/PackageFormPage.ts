import { SuggestInput } from '../../components/SuggestInput';
import { AuthenticatedPage } from '../AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

export interface PackageFormData {
  product?: string; // product symbol, picked from suggestions
  quantity?: number;
  name?: string;
  sku?: string;
  weightG?: number;
  fnsku?: string;
  asin?: string;
  codeType?: 'EAN' | 'UPC';
  code?: string;
}

// "Nowy pakiet" / "Edycja pakietu" of a platform:
// /platforms/{platformId}/packages/new and /platforms/{platformId}/packages/{id}/edit
export class PackageFormPage extends AuthenticatedPage {
  private platformId = 0;
  private packageId?: number;
  readonly productPicker: SuggestInput;
  readonly quantityInput: Locator;
  readonly nameInput: Locator;
  readonly skuInput: Locator;
  readonly weightInput: Locator;
  readonly fnskuInput: Locator;
  readonly asinInput: Locator;
  readonly codeTypeSelect: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productPicker = new SuggestInput(
      page,
      page.getByRole('combobox', { name: 'Produkt' }),
    );
    this.quantityInput = page.getByLabel('Sztuk w pakiecie');
    this.nameInput = page.getByRole('textbox', { name: 'Nazwa', exact: true });
    this.skuInput = page.getByRole('textbox', { name: 'SKU', exact: true });
    this.weightInput = page.getByLabel('Waga (g, opcjonalnie)');
    this.fnskuInput = page.getByLabel('Kod kreskowy Amazon (FNSKU)');
    this.asinInput = page.getByLabel('ASIN');
    this.codeTypeSelect = page.getByLabel('Typ kodu');
    this.saveButton = page.getByRole('button', { name: 'Zapisz' });
    this.deleteButton = page.getByRole('button', { name: 'Usuń' });
  }

  get path(): string {
    const base = `/platforms/${this.platformId}/packages`;
    return this.packageId ? `${base}/${this.packageId}/edit` : `${base}/new`;
  }

  forPlatform(platformId: number): this {
    this.platformId = platformId;
    this.packageId = undefined;
    return this;
  }

  forPackage(platformId: number, packageId: number): this {
    this.platformId = platformId;
    this.packageId = packageId;
    return this;
  }

  // The code field is labelled with the chosen type ("EAN" / "UPC"),
  // or "Kod" and disabled while no type is chosen.
  codeInput(label: 'Kod' | 'EAN' | 'UPC'): Locator {
    return this.page.getByRole('textbox', { name: label, exact: true });
  }

  // Waits until the edit form shows the package loaded from the API.
  async open(): Promise<void> {
    await super.open();
    if (this.packageId) await expect(this.skuInput).not.toHaveValue('');
  }

  async fillForm(data: PackageFormData): Promise<void> {
    if (data.product !== undefined) {
      await this.productPicker.pick(data.product);
      await expect(this.productPicker.input).toHaveValue(
        new RegExp(`^${data.product} – `),
      );
    }
    if (data.quantity !== undefined) {
      await this.quantityInput.fill(String(data.quantity));
    }
    if (data.name !== undefined) await this.nameInput.fill(data.name);
    if (data.sku !== undefined) await this.skuInput.fill(data.sku);
    if (data.weightG !== undefined) {
      await this.weightInput.fill(String(data.weightG));
    }
    if (data.fnsku !== undefined) await this.fnskuInput.fill(data.fnsku);
    if (data.asin !== undefined) await this.asinInput.fill(data.asin);
    if (data.codeType) {
      await this.codeTypeSelect.selectOption({ label: data.codeType });
      if (data.code !== undefined) {
        await this.codeInput(data.codeType).fill(data.code);
      }
    }
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  // Name and SKU are suggested from the product and quantity, e.g. "KN1-50".
  async expectSuggestedNameAndSku(name: string, sku: string): Promise<void> {
    await expect(this.nameInput).toHaveValue(name);
    await expect(this.skuInput).toHaveValue(sku);
  }

  async expectCodeInputDisabledUntilTypeChosen(): Promise<void> {
    await expect(this.codeInput('Kod')).toBeDisabled();
    await expect(
      this.page.getByText('Najpierw wybierz typ kodu.'),
    ).toBeVisible();
  }

  // Packages that can still be assembled from stock cannot be deleted.
  async expectDeleteBlocked(available: number): Promise<void> {
    await expect(this.deleteButton).toBeDisabled();
    await expect(
      this.page.getByText(
        `Dostępne: ${available} pak. – usunąć można tylko pakiet z dostępnością 0.`,
      ),
    ).toBeVisible();
  }
}

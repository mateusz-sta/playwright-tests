import { PRICE_UNIT, TextOf } from '../../utils/appTexts';
import { ProductPage } from './ProductPage';
import { Locator, Page, expect } from '@playwright/test';

export interface ProductFormData {
  name?: string;
  symbol?: string;
  netPrice?: number;
  priceUnit?: TextOf<typeof PRICE_UNIT>;
  vatRate?: '23%' | '8%' | '5%' | '0%';
}

// "Nowy produkt" (/products/new) and "Edycja produktu" (/products/{id}/edit).
export class ProductFormPage extends ProductPage {
  private productId?: number;
  readonly nameInput: Locator;
  readonly symbolInput: Locator;
  readonly netPriceInput: Locator;
  readonly priceUnitSelect: Locator;
  readonly vatRateSelect: Locator;
  readonly saveButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Nazwa');
    this.symbolInput = page.getByLabel('Symbol');
    this.netPriceInput = page.getByLabel('Cena netto (zł)');
    this.priceUnitSelect = page.getByLabel('Cena podana za');
    this.vatRateSelect = page.getByLabel('Stawka VAT');
    this.saveButton = page.getByRole('button', { name: 'Zapisz' });
    this.errorAlert = page.getByRole('main').getByRole('alert');
  }

  get path(): string {
    return this.productId
      ? `/products/${this.productId}/edit`
      : '/products/new';
  }

  // Switches the page object to the edit form of an existing product.
  forProduct(id: number): this {
    this.productId = id;
    return this;
  }

  // Switches the page object to the "Nowy produkt" form.
  forNewProduct(): this {
    this.productId = undefined;
    return this;
  }

  // Waits until the edit form shows the product loaded from the API.
  async open(): Promise<void> {
    await super.open();
    if (this.productId) await expect(this.symbolInput).not.toHaveValue('');
  }

  async fillForm(data: ProductFormData): Promise<void> {
    if (data.name !== undefined) await this.nameInput.fill(data.name);
    if (data.symbol !== undefined) await this.symbolInput.fill(data.symbol);
    if (data.netPrice !== undefined) {
      await this.netPriceInput.fill(String(data.netPrice));
    }
    if (data.priceUnit) {
      await this.priceUnitSelect.selectOption({ label: data.priceUnit });
    }
    if (data.vatRate) {
      await this.vatRateSelect.selectOption({ label: data.vatRate });
    }
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async expectNetPrice(value: string): Promise<void> {
    await expect(this.netPriceInput).toHaveValue(value);
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorAlert).toHaveText(message);
  }
}

import { AuthenticatedPage } from '../AuthenticatedPage';
import { expect } from '@playwright/test';

// Prices calculated by the app, e.g. { per1000Gross: '52,28 zł' }.
export interface CalculatedPrices {
  per1000Net: string;
  per1000Gross: string;
  unitNet: string;
  unitGross: string;
}

// Base for pages that show the calculated prices of a product.
export abstract class ProductPage extends AuthenticatedPage {
  async expectPrices(prices: CalculatedPrices): Promise<void> {
    await expect(this.definition('Za 1000 szt. netto')).toHaveText(
      prices.per1000Net,
    );
    await expect(this.definition('Za 1000 szt. brutto')).toHaveText(
      prices.per1000Gross,
    );
    await expect(this.definition('Cena jedn. netto')).toHaveText(
      prices.unitNet,
    );
    await expect(this.definition('Cena jedn. brutto')).toHaveText(
      prices.unitGross,
    );
  }
}

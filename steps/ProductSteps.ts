import { ProductsPage } from '../pages/ProductsPage';
import { ProductDetailsPage } from '../pages/products/ProductDetailsPage';
import {
  ProductFormData,
  ProductFormPage,
} from '../pages/products/ProductFormPage';

// Product flows made of several page actions.
export class ProductSteps {
  constructor(
    private readonly form: ProductFormPage,
    private readonly details: ProductDetailsPage,
    private readonly list: ProductsPage,
  ) {}

  // Fills "Nowy produkt" and clicks "Zapisz" – also for checking validation errors.
  async submitNewProduct(data: ProductFormData): Promise<void> {
    await this.form.forNewProduct().open();
    await this.form.fillForm(data);
    await this.form.save();
  }

  // Adds a product and returns its id (the app then shows the product card).
  async addProduct(data: ProductFormData): Promise<number> {
    await this.submitNewProduct(data);
    return this.details.rememberIdFromUrl();
  }

  // Opens the edit form, changes the given fields and saves.
  async editProduct(id: number, data: ProductFormData): Promise<void> {
    await this.form.forProduct(id).open();
    await this.form.fillForm(data);
    await this.form.save();
    await this.details.forProduct(id).expectToBeOpened();
  }

  // Deletes the product from its card (confirms the browser dialog).
  async deleteProduct(id: number, name: string): Promise<void> {
    await this.details.forProduct(id).open();
    await this.details.expectToBeOpened();
    await this.details.delete(name);
  }

  // Opens the product list filtered by the search text.
  async searchList(text: string): Promise<void> {
    await this.list.open();
    await this.list.searchBar.search(text);
  }
}

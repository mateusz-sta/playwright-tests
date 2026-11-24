import {
  PackageFormData,
  PackageFormPage,
} from '../pages/packages/PackageFormPage';
import { PackagesListPage } from '../pages/packages/PackagesListPage';

// Package flows of a platform.
export class PackageSteps {
  constructor(
    private readonly form: PackageFormPage,
    private readonly list: PackagesListPage,
  ) {}

  // Fills "Nowy pakiet" and saves; the app returns to the platform's package list.
  async addPackage(platformId: number, data: PackageFormData): Promise<void> {
    await this.form.forPlatform(platformId).open();
    await this.form.fillForm(data);
    await this.form.save();
    await this.list.forPlatform(platformId).expectToBeOpened();
  }

  // Opens the package list of a platform filtered by the search text.
  async searchList(platformId: number, text: string): Promise<void> {
    await this.list.forPlatform(platformId).open();
    await this.list.searchBar.search(text);
  }

  async openEditForm(platformId: number, packageId: number): Promise<void> {
    await this.form.forPackage(platformId, packageId).open();
  }
}

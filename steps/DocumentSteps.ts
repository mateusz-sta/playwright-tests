import { DocumentDetailsPage } from '../pages/documents/DocumentDetailsPage';
import { IssueFormPage } from '../pages/documents/IssueFormPage';
import { ReceiptFormPage } from '../pages/documents/ReceiptFormPage';

// Stock documents: receipts (stock in) and issues (stock out).
export class DocumentSteps {
  constructor(
    private readonly receiptForm: ReceiptFormPage,
    private readonly issueForm: IssueFormPage,
    private readonly details: DocumentDetailsPage,
  ) {}

  // Fills "Nowe przyjęcie" with one product, submits and returns the document id.
  async receive(symbol: string, quantity: number): Promise<number> {
    await this.receiptForm.open();
    await this.receiptForm.addProduct(symbol, quantity);
    await this.receiptForm.submit();
    return this.details.rememberIdFromUrl();
  }

  // Fills "Nowe wydanie" with packages of one platform, submits and returns the document id.
  async issue(
    platform: string,
    sku: string,
    packages: number,
  ): Promise<number> {
    await this.issueForm.open();
    await this.issueForm.selectPlatform(platform);
    await this.issueForm.addPackage(sku, packages);
    await this.issueForm.submit();
    return this.details.rememberIdFromUrl();
  }

  // Deletes the document shown on the page (stock movements are reverted).
  async deleteOpenedDocument(): Promise<void> {
    await this.details.open();
    await this.details.delete();
  }
}

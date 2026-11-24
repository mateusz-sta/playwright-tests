import { SchemaRef, validateAgainstSchema } from '../api/schemaValidator';
import { CreateUserPage } from '../pages/CreateUserPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { DocumentDetailsPage } from '../pages/documents/DocumentDetailsPage';
import { IssueFormPage } from '../pages/documents/IssueFormPage';
import { ReceiptFormPage } from '../pages/documents/ReceiptFormPage';
import { PackageFormPage } from '../pages/packages/PackageFormPage';
import { PackagesListPage } from '../pages/packages/PackagesListPage';
import { PackingListDetailsPage } from '../pages/packing/PackingListDetailsPage';
import { PackingListFormPage } from '../pages/packing/PackingListFormPage';
import { ProductDetailsPage } from '../pages/products/ProductDetailsPage';
import { ProductFormPage } from '../pages/products/ProductFormPage';
import { ShipmentDetailsPage } from '../pages/shipments/ShipmentDetailsPage';
import { ShipmentFormPage } from '../pages/shipments/ShipmentFormPage';
import { DocumentSteps } from '../steps/DocumentSteps';
import { PackageSteps } from '../steps/PackageSteps';
import { ProductSteps } from '../steps/ProductSteps';
import { ShippingSteps } from '../steps/ShippingSteps';
import { test as base } from './apiFixtures';
import { MatcherReturnType, expect as baseExpect } from '@playwright/test';

type Pages = {
  homePage: HomePage;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  createUserPage: CreateUserPage;
  productFormPage: ProductFormPage;
  productDetailsPage: ProductDetailsPage;
  receiptFormPage: ReceiptFormPage;
  issueFormPage: IssueFormPage;
  documentDetailsPage: DocumentDetailsPage;
  packageFormPage: PackageFormPage;
  packagesListPage: PackagesListPage;
  packingListFormPage: PackingListFormPage;
  packingListDetailsPage: PackingListDetailsPage;
  shipmentFormPage: ShipmentFormPage;
  shipmentDetailsPage: ShipmentDetailsPage;
};

// Multi-step UI flows (steps/).
type Steps = {
  productSteps: ProductSteps;
  documentSteps: DocumentSteps;
  packageSteps: PackageSteps;
  shippingSteps: ShippingSteps;
};

// Page objects and steps; API clients and test data come from apiFixtures.ts.
export const test = base.extend<Pages & Steps>({
  productSteps: async (
    { productFormPage, productDetailsPage, productsPage },
    use,
  ) => {
    await use(
      new ProductSteps(productFormPage, productDetailsPage, productsPage),
    );
  },
  documentSteps: async (
    { receiptFormPage, issueFormPage, documentDetailsPage },
    use,
  ) => {
    await use(
      new DocumentSteps(receiptFormPage, issueFormPage, documentDetailsPage),
    );
  },
  packageSteps: async ({ packageFormPage, packagesListPage }, use) => {
    await use(new PackageSteps(packageFormPage, packagesListPage));
  },
  shippingSteps: async (
    {
      packingListFormPage,
      packingListDetailsPage,
      shipmentFormPage,
      shipmentDetailsPage,
    },
    use,
  ) => {
    await use(
      new ShippingSteps(
        packingListFormPage,
        packingListDetailsPage,
        shipmentFormPage,
        shipmentDetailsPage,
      ),
    );
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  createUserPage: async ({ page }, use) => {
    await use(new CreateUserPage(page));
  },
  productFormPage: async ({ page }, use) => {
    await use(new ProductFormPage(page));
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  receiptFormPage: async ({ page }, use) => {
    await use(new ReceiptFormPage(page));
  },
  issueFormPage: async ({ page }, use) => {
    await use(new IssueFormPage(page));
  },
  documentDetailsPage: async ({ page }, use) => {
    await use(new DocumentDetailsPage(page));
  },
  packageFormPage: async ({ page }, use) => {
    await use(new PackageFormPage(page));
  },
  packagesListPage: async ({ page }, use) => {
    await use(new PackagesListPage(page));
  },
  packingListFormPage: async ({ page }, use) => {
    await use(new PackingListFormPage(page));
  },
  packingListDetailsPage: async ({ page }, use) => {
    await use(new PackingListDetailsPage(page));
  },
  shipmentFormPage: async ({ page }, use) => {
    await use(new ShipmentFormPage(page));
  },
  shipmentDetailsPage: async ({ page }, use) => {
    await use(new ShipmentDetailsPage(page));
  },
});

export const expect = baseExpect.extend({
  // expect(body).toMatchSchema('ProductDto') / toMatchSchema('ProductDto[]')
  // checks the body against the schema from the API documentation.
  toMatchSchema(received: unknown, schema: SchemaRef): MatcherReturnType {
    const errors = validateAgainstSchema(schema, received);
    const pass = errors.length === 0;
    return {
      pass,
      name: 'toMatchSchema',
      expected: schema,
      actual: received,
      message: () =>
        pass
          ? `Expected the body not to match schema ${schema}`
          : `Body does not match schema ${schema} from the API docs:\n` +
            errors.map((error) => `  - ${error}`).join('\n'),
    };
  },
});

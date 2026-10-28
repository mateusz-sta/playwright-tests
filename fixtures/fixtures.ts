import { AuthApi } from '../api/AuthApi';
import { SchemaRef, validateAgainstSchema } from '../api/schemaValidator';
import { CreateUserPage } from '../pages/CreateUserPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import {
  MatcherReturnType,
  test as base,
  expect as baseExpect,
} from '@playwright/test';

type Pages = {
  homePage: HomePage;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  createUserPage: CreateUserPage;
};

type ApiClients = {
  authApi: AuthApi;
};

export const test = base.extend<Pages & ApiClients>({
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
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
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

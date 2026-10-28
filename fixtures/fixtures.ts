import { AuthApi } from '../api/AuthApi';
import { CreateUserPage } from '../pages/CreateUserPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { test as base } from '@playwright/test';

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

export { expect } from '@playwright/test';

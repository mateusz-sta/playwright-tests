# Prepare

### Repository:

📦 [GitHub Repository](https://github.com/mateusz-sta/playwright-tests.git)

### Local recommended tools:

- VSC
- Git
- Node.js (version 20 or newer)

### Installation and setup:

- clone the repository: `git clone https://github.com/mateusz-sta/playwright-tests.git`
- enter the repository directory: `cd playwright-tests`
- (optional) install recommended VS Code extensions
- install project dependencies: `npm run install:deps`
- install Playwright browser binaries: `npm run deps:playwright`
- create environment variables file from the template: `npm run setup:env`
- (important) fill in the `.env` file with your configuration

Installing dependencies also activates the Husky `pre-commit` hook (lint, format check and type check).

### Project structure:

- `tests/ui/` – browser tests (`*.spec.ts`), grouped by feature, run in the `chromium` project.
- `tests/account.setup.ts` – runs first: waits for the app (it sleeps after ~15 min without traffic, see
  `utils/waitForApp.ts`), checks that the test user can log in and, if the user does not exist
  (e.g. after a database reset), creates it with the admin account. When it fails, UI and API tests do not run.
- `tests/auth.setup.ts` – **the only UI test that logs in** (valid credentials). Runs before all UI tests and saves the
  session to `playwright/.auth/user.json` (the app keeps it in localStorage, `storageState` stores cookies and localStorage);
  all UI tests start logged in. To start logged out, use `test.use({ storageState: { cookies: [], origins: [] } })`.
- `pages/` – Page Objects; one class per page. Pages extend `BasePage` (`open()`, `expectToBeOpened()`),
  pages available after logging in extend `AuthenticatedPage` (adds `header`).
- `components/` – parts shared by many pages, e.g. `Header` (logged-in user, logout).
- `tests/api/` – API tests (`*.api.spec.ts`), run in the `api` project without a browser.
- `api/` – API clients, one class per resource (e.g. `AuthApi` for `/api/auth`, `ProductsApi` for `/api/products`),
  `types.ts` with request/response interfaces from the [API docs](https://magazyn-test.onrender.com/api/docs)
  and `apiContext.ts` with helpers that create logged-in request contexts.
- `fixtures/` – custom Playwright fixtures; import `test` and `expect` from `fixtures/fixtures.ts` in tests
  (page objects and steps; API clients and `testData` come from `apiFixtures.ts`).
- `test-data/` – test data, e.g. `getTestUser()` with credentials from `.env`; `ui.ts` holds values and texts of the UI tests,
  `defaults.ts` the values of data created by `TestData`; `TestData.ts` creates and cleans up data of one test (UI and API).
- `steps/` – multi-step UI flows built from page objects, e.g. `productSteps.addProduct()`, `documentSteps.receive()`.
- `utils/` – shared helpers, e.g. `requireEnv()` for reading required environment variables, and `appTexts.ts`
  with app texts used by both page objects and tests (statuses, document types).

### Page Object Model conventions:

- Tests talk only to page objects – no `page.goto`, raw selectors or `process.env` in test files.
- Locators and actions live in page objects; checks are `expect*` methods (e.g. `loginPage.expectError()`).
- ESLint treats page object methods named `expect*` as assertions (`assertFunctionPatterns` in `eslint.config.mjs`).

### UI test layers (change things in one place, not in every test):

| Layer            | Where                                        | What                                                                                                                                                                                    |
| ---------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page objects     | `pages/`, `components/`                      | locators and single-page actions/checks                                                                                                                                                 |
| Steps            | `steps/`                                     | multi-step flows, e.g. fill a form, save, return the new id                                                                                                                             |
| Test data        | `testData` fixture (`test-data/TestData.ts`) | data created through the API before the test (`testData.catalog({ stock: 500 })`); everything gets a unique prefix and is deleted after the test – also what the test created in the UI |
| Values and texts | `test-data/ui.ts`                            | prices, quantities, messages, text builders such as `pcs(250)` → `"250 szt."`                                                                                                           |

UI tests contain only the scenario and the checks – no locators, API calls, `beforeAll`/`afterAll` or app texts.
Literals are fine only when they describe the scenario itself (e.g. `kind: 'AMAZON'`, one line, zero stock).

### API test conventions:

- Tests call API clients from fixtures (`productsApi`, `ordersApi`, …), never `request.post('/api/...')` directly.
  The clients are logged in as the test user: one login per worker (UI tests reuse the saved session instead).
  `authApi` and `request` send no token.
- Every test is independent: it creates its own data with `testData` (e.g. `testData.catalog({ stock: 500 })`,
  `testData.shipment(pkg, 2)`), so tests run in any order and in parallel. No `serial` mode, `beforeAll`/`afterAll`
  or variables shared between tests – one failing test must not skip others.
- Use names from `testData` in tested requests too (`testData.name()`, `orderName()`, `userRequest()`, …):
  they are prefixed with `PW-TEST` and deleted after the test, also when it fails.
- Known bugs are covered with `test.fail()` and a description – when the bug is fixed, the test reports it.
- Check every successful response against the API docs: `expect(body).toMatchSchema('ProductDto')`
  (`'ProductDto[]'` for lists). Schemas come from `api/openapi.json`, a saved copy of the docs.
  For `await response.json()` use `expect<unknown>(...)` – Playwright hides custom matchers on `any`.
- `tests/api/contract.api.spec.ts` fails when the live docs differ from `api/openapi.json`:
  run `npm run api:update-spec`, review the diff and adjust the tests.
- Client methods return the raw `APIResponse`; tests check the status code and the body shape from the docs.
- Only read data or create data your test owns and cleans up – the test environment is shared.
  Never call `DELETE /api/demo/data` or `POST /api/demo/seed` from tests.
- Don't send many wrong passwords for the test user – the API blocks it after too many failed attempts (429).

### Test results dashboard (Allure):

📊 **https://mateusz-sta.github.io/playwright-tests/** – updated after every run on `main`:
every night at 03:00 UTC, after each push/merge, or on a manual run (Actions → Playwright Tests → Run workflow).

- **Awesome** – all tests grouped by suite, with steps, errors and screenshots.
- **Dashboard** – charts: current status, trends over previous runs, flaky tests.
- The report is public, so CI removes Playwright traces and videos from it
  (`scripts/strip-allure-attachments.mjs`) – a trace records what was typed, including the password.
  Full traces are in the `playwright-report` artifact of the run.
- Locally: run tests, then `npm run allure:generate` and `npm run allure:open`.

### CI (GitHub Actions):

Tests run on every push and pull request to `main`. Add these repository secrets
(Settings → Secrets and variables → Actions): `BASE_URL`, `TEST_USER_USERNAME`, `TEST_USER_PASSWORD`,
`ADMIN_USERNAME`, `ADMIN_PASSWORD`.

### Available scripts:

- `install:deps` - installs the exact dependency versions from `package-lock.json` (`npm ci`).
- `deps:playwright` – installs Playwright with required Chromium dependencies.
- `setup:env` – creates the local environment file (`.env`) from the template.
- `format` – auto-formats the code with Prettier.
- `format:check` – verifies if the code is properly formatted with Prettier (without modifying files).
- `lint` – checks code with ESLint, allowing zero warnings.
- `test:headless` – runs Playwright tests in headless mode.
- `test:headed` – runs Playwright tests with a visible browser for debugging.
- `test:ui` – launches Playwright’s interactive UI.
- `test:e2e` – runs only the browser tests (with the login `setup` step).
- `test:api` – runs only the API tests.
- `api:update-spec` – downloads the current API docs into `api/openapi.json`.
- `test:report` – opens the generated Playwright HTML report.
- `tsc:check` – runs TypeScript compiler (strict mode, configured in `tsconfig.json`) to check for type errors without emitting files.

### Tools Used:

- [Dotenv](https://github.com/motdotla/dotenv) – manages environment variables by loading them from a `.env` file.
- [ESLint](https://eslint.org/) – analyzes and enforces coding standards.
- [Faker.js](https://fakerjs.dev/) – generates large amounts of fake data for testing and development.
- [Husky](https://typicode.github.io/husky/) – manages Git hooks to run checks before commits.
- [Playwright](https://playwright.dev/) – provides end-to-end testing with fast and reliable browser automation.
- [Prettier](https://prettier.io/) – automatically formats code to keep a consistent style.
- [TypeScript](https://www.typescriptlang.org/) – ensures static type safety and improves code reliability.

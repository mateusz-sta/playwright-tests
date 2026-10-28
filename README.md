# Prepare

### Repository:

📦 [GitHub Repository](https://github.com/mateusz-sta/playwright-tests.git)

### Local recommended tools:

- VSC
- Git
- Node.js (version 18 or newer)

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

- `tests/` – test files (`*.spec.ts`), grouped by feature.
- `pages/` – Page Objects; one class per page, extending `BasePage`.
- `fixtures/` – custom Playwright fixtures; import `test` and `expect` from `fixtures/fixtures.ts` in tests.
- `utils/` – shared helpers, e.g. `requireEnv()` for reading required environment variables.

### CI (GitHub Actions):

Tests run on every push and pull request to `main`. Add these repository secrets
(Settings → Secrets and variables → Actions): `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.

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

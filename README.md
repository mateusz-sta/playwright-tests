# Prepare

### Repository:

📦 [GitHub Repository](https://github.com/mateusz-sta/playwright-tests.git)

### Local recommended tools:

- VSC
- Git
- Node.js (version >16)

### Installation and setup:

- clone and enter the repository: `git clone https://github.com/mateusz-sta/playwright-tests.git`
- (optional) install VSC recommended plugins
- install dependencies: `npm install`
- setup Playwright with: `npm run deps:playwright`

### Available scripts:

- `install:deps` - installs all project dependencies listed in `package.json`.
- `deps:playwright` – installs Playwright with required Chromium dependencies.
- `format` – auto-formats the code with Prettier.
- `format:check` – verifies if the code is properly formatted with Prettier (without modifying files).
- `lint` – checks code with ESLint, allowing zero warnings.
- `test:headless` – runs Playwright tests in headless mode.
- `test:headed` – runs Playwright tests with a visible browser for debugging.
- `test:ui` – launches Playwright’s interactive UI.
- `test:report` – opens the generated Playwright HTML report.
- `tsc:check` – runs TypeScript compiler in strict mode to check for type errors without emitting files.

### Tools Used:

- **Prettier** – automatically formats code to keep a consistent style.
- **ESLint** – analyzes and enforces coding standards.
- **Husky** – manages Git hooks to run checks before commits.
- **Playwright** – provides end-to-end testing with fast and reliable browser automation.
- **TypeScript** – ensures static type safety and improves code reliability.

import { defineConfig } from 'allure';

// Allure report (dashboard) generated from ./allure-results.
// history.jsonl keeps results of previous runs, so the report can show trends.
// In CI it is downloaded from the published report before generating – see .github/workflows/playwright.yml.
export default defineConfig({
  name: 'Magazyn – automated tests',
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  historyLimit: 50,
  plugins: {
    awesome: {
      options: {
        reportName: 'Magazyn – automated tests',
        groupBy: ['parentSuite', 'suite', 'subSuite'],
      },
    },
    dashboard: {
      options: {
        reportName: 'Magazyn – dashboard',
      },
    },
  },
});

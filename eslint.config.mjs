import pluginJs from '@eslint/js';
import eslintPluginPlaywright from 'eslint-plugin-playwright';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '.gitignore',
      'package-lock.json',
      'playwright-report/**',
      'test-results/**',
      'allure-results/**',
      'allure-report/**',
      'allure-history/**',
    ],
  },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
    },
  },
  {
    // Rules that need type information. A missing `await` on a Playwright call
    // makes tests pass falsely or flake – recommended by the Playwright docs.
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  {
    // Command-line scripts (plain JS) report progress to the console.
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    ...eslintPluginPlaywright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'playwright/no-nested-step': 'off',
      // Page object methods that contain assertions; add new expect* methods here.
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'expectToBeOpened',
            'expectTitle',
            'expectError',
            'expectRedirectedFrom',
            'expectLoggedInAs',
          ],
        },
      ],
    },
    settings: {
      playwright: {
        globalAliases: {
          test: ['setup'],
        },
      },
    },
  },
  eslintPluginPrettierRecommended,
];

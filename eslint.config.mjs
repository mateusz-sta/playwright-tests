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

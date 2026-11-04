// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** Architecture §3: apps/web and apps/api never import from each other. */
const noCrossAppImports = (otherApp) => ({
  'no-restricted-imports': [
    'error',
    {
      // Exact workspace package name only; a bare pattern would also block e.g. `@/lib/api`.
      paths: [
        {
          name: otherApp,
          message: 'apps/web and apps/api never import from each other (architecture §3).',
        },
      ],
      patterns: [
        {
          group: [`**/apps/${otherApp}`, `**/apps/${otherApp}/**`, `**/${otherApp}/src/**`],
          message: 'apps/web and apps/api never import from each other (architecture §3).',
        },
      ],
    },
  ],
});

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/.next/',
    '**/.next-e2e/',
    '**/next-env.d.ts',
    '**/coverage/',
  ]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Config files that no tsconfig includes.
          allowDefaultProject: ['apps/api/vitest.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      ...noCrossAppImports('web'),
      // Nest modules are decorated empty classes by design.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },

  {
    files: ['apps/web/**/*.{ts,tsx,js,mjs}'],
    extends: [nextVitals],
    settings: { next: { rootDir: 'apps/web/' } },
    rules: noCrossAppImports('api'),
  },

  prettier,
]);

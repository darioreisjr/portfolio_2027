import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import angular from 'angular-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

const otherApps = (own) =>
  ['shell', 'mfe-vue', 'mfe-react', 'mfe-angular', 'web-next']
    .filter((app) => app !== own)
    .map((app) => `**/${app}/**`);

// Regras de fronteira do AGENTS.md que dá para cobrar por lint.
const boundaries = (app, { forbidDesignSystemRuntime }) => ({
  files: [`apps/${app}/src/**`, `apps/${app}/app/**`],
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: otherApps(app),
            message: 'Um app nunca importa código de outro app. Use packages/contracts.',
          },
          {
            group: ['**/*.json'],
            message: 'Dados só entram por @portfolio/content.',
          },
          ...(forbidDesignSystemRuntime
            ? [
                {
                  group: ['lit', 'lit/*', '@lit/*'],
                  message: 'MFEs não empacotam o Lit; o shell carrega o design system.',
                },
                {
                  group: ['@portfolio/design-system', '@portfolio/design-system/*'],
                  allowTypeImports: true,
                  message: 'MFEs usam só os tipos do design system (import type).',
                },
              ]
            : []),
        ],
      },
    ],
  },
});

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.angular/**',
      '**/storybook-static/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.lighthouseci/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // Vue
  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['apps/mfe-vue/**/*.vue'],
  })),
  {
    files: ['apps/mfe-vue/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser },
      // Fixada no build pelo `define` do Vite (apps/mfe-vue/src/env.d.ts).
      globals: { __HAS_CONTENT__: 'readonly' },
    },
    rules: {
      // Quem formata é o Prettier; estas duas regras de layout brigam com ele.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
    },
  },

  // Angular
  {
    files: ['apps/mfe-angular/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
  },
  {
    files: ['apps/mfe-angular/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },

  // React e Next.js
  {
    files: ['apps/mfe-react/**/*.{ts,tsx}', 'apps/web-next/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    files: ['apps/web-next/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    settings: { next: { rootDir: 'apps/web-next' } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  boundaries('shell', { forbidDesignSystemRuntime: false }),
  boundaries('web-next', { forbidDesignSystemRuntime: false }),
  boundaries('mfe-vue', { forbidDesignSystemRuntime: true }),
  boundaries('mfe-react', { forbidDesignSystemRuntime: true }),
  boundaries('mfe-angular', { forbidDesignSystemRuntime: true }),
);

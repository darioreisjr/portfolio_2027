import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/web-components-vite', options: {} },
  // No mesmo caminho em que o site publica as bandeiras.
  staticDirs: [{ from: '../assets', to: '/_ds' }],
};

export default config;

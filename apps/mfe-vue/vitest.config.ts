import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { vuePlugin } from './vite.config.ts';

export default defineConfig({
  plugins: [vuePlugin()],
  test: {
    include: ['src/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});

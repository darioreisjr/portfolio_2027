import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// A doc do Lit pede teste em navegador real.
export default defineConfig({
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

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { vuePlugin } from './vite.config.ts';

export default defineConfig({
  plugins: [vuePlugin()],
  // Os testes trocam o conteúdo por um de teste; a página tem de estar no bundle.
  define: { __HAS_CONTENT__: 'true' },
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

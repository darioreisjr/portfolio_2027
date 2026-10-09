import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// O e2e roda contra o dist/ montado do build de produção, como o site publicado.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Todo teste começa como quem já respondeu ao pop-up de imersão da home, com
    // as animações ligadas. A primeira visita é testada em e2e/home-intro.spec.ts.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: `http://localhost:${PORT}`,
          localStorage: [{ name: 'portfolio:home-animacoes', value: 'on' }],
        },
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node scripts/serve-dist.mjs ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});

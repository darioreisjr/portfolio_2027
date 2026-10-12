import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// O e2e roda contra o dist/ montado do build de produção, como o site publicado.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // No CI o e2e é checagem obrigatória do merge: repete até duas vezes antes de
  // falhar. O relatório marca o que passou só na repetição; teste assim é
  // defeito a consertar, não ruído a aceitar.
  retries: process.env.CI ? 2 : 0,
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
  // O portão do merge roda só o Chromium. Firefox e WebKit entram com
  // `E2E_BROWSERS=all`, na execução noturna (`.github/workflows/navegadores.yml`).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.E2E_BROWSERS === 'all'
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});

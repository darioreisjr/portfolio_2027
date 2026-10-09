import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

// Checagem local das páginas que só existem com conteúdo em rascunho. Roda por
// `pnpm test:e2e:drafts`, que antes monta o dist/ com os rascunhos. Não entra no
// CI: lá o dist/ é o de produção (playwright.config.ts).
export default defineConfig({
  testDir: 'e2e-drafts',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node scripts/serve-dist.mjs ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});

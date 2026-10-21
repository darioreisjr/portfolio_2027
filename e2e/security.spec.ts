import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/recrutador/', name: 'Recrutador' },
  { path: '/tecnico/', name: 'Técnico' },
  { path: '/clientes/', name: 'Clientes' },
  { path: '/comunidade/', name: 'Comunidade' },
  { path: '/como-foi-feito/', name: 'Como foi feito' },
  { path: '/en/', name: 'Home (en)' },
  { path: '/en/recruiter/', name: 'Recruiter (en)' },
  { path: '/es/reclutador/', name: 'Reclutador (es)' },
  { path: '/rota-inexistente/', name: 'Página 404', expectedStatus: 404 },
];

function trackConsoleAndCspViolations(page: Page) {
  const violations: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text().toLowerCase();
    if (
      msg.type() === 'error' ||
      text.includes('content security policy') ||
      text.includes('violates') ||
      text.includes('blocked by csp')
    ) {
      // Ignora erro natural de 404 ao carregar rota inexistente
      if (text.includes('404 (not found)')) return;
      violations.push(`[console.${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    violations.push(`[pageerror] ${err.message}`);
  });
  return violations;
}

test.describe('Content-Security-Policy (issue #47)', () => {
  for (const { path, name, expectedStatus = 200 } of PAGES) {
    test(`responde com CSP válida e sem erros de console em ${name} (${path})`, async ({
      page,
    }) => {
      const violations = trackConsoleAndCspViolations(page);

      const response = await page.goto(path, { waitUntil: 'networkidle' });
      expect(response).not.toBeNull();
      expect(response?.status()).toBe(expectedStatus);

      const headers = response?.headers() ?? {};
      const csp = headers['content-security-policy'];
      expect(csp, `Cabeçalho Content-Security-Policy ausente na rota ${path}`).toBeDefined();

      // Diretivas essenciais
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data:");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("media-src 'self'");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'none'");
      expect(csp).toContain("object-src 'none'");

      // script-src deve ter hashes e NÃO ter unsafe-inline nem unsafe-eval
      const scriptSrcMatch = csp?.match(/script-src\s+([^;]+)/);
      expect(scriptSrcMatch).not.toBeNull();
      const scriptSrc = scriptSrcMatch?.[1] ?? '';

      expect(scriptSrc).toContain("'self'");
      expect(scriptSrc).toContain("'sha256-");
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");

      // Zero violações de CSP ou erros de execução no console do navegador
      expect(violations).toEqual([]);
    });
  }

  test('scripts essenciais inline funcionam normalmente sob a CSP', async ({ page }) => {
    // 1. Alterna o tema e recarrega para testar o script inline do tema que lê do localStorage antes do paint
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Tema escuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Recarrega: o script inline no <head> executa e aplica data-theme="dark" imediatamente
    await page.reload({ waitUntil: 'domcontentloaded' });
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // 2. Custom element da home monta e responde
    await expect(page.locator('main')).toBeVisible();

    // 3. MFE Vue sob o shell monta e responde
    await page.goto('/recrutador/', { waitUntil: 'networkidle' });
    await expect(page.locator('mfe-recrutador')).toBeAttached();
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'recruiter');
  });
});

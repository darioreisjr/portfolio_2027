import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const SURFACE_LIGHT = 'rgb(255, 255, 255)';

const mfeAreas = [
  { path: '/recrutador/', area: 'recruiter', tag: 'mfe-recrutador', framework: 'Vue' },
  { path: '/tecnico/', area: 'tech', tag: 'mfe-tecnico', framework: 'Angular' },
  { path: '/clientes/', area: 'client', tag: 'mfe-clientes', framework: 'React' },
];

// A home tem testes próprios em home.spec.ts.
const nextPages = ['/comunidade/', '/como-foi-feito/'];

/** Falha o teste se a página lançar erro ou escrever erro no console. */
function failOnBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function expectAccessible(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test.use({ colorScheme: 'light' });

for (const { path, area, tag, framework } of mfeAreas) {
  test(`${path} renderiza a mensagem do MFE ${framework} dentro do shell`, async ({ page }) => {
    const errors = failOnBrowserErrors(page);
    await page.goto(path);

    // O MFE avisou o shell pelo evento de packages/contracts.
    await expect(page.locator('main')).toHaveAttribute('data-ready', area);

    const mfe = page.locator(tag);
    await expect(mfe).toHaveAttribute('locale', 'pt-BR');
    // O texto vem de packages/content; a aparência, da folha das páginas
    // internas, que alcança o shadow DOM do MFE pelos `part` (ADR 0009).
    await expect(mfe).toContainText('Fase em construção');
    await expect(mfe.locator('[part="message"]')).toHaveCSS('background-color', SURFACE_LIGHT);

    await expectAccessible(page);
    expect(errors).toEqual([]);
  });
}

for (const path of nextPages) {
  test(`${path} é uma página Next.js com conteúdo e design system`, async ({ page }) => {
    const errors = failOnBrowserErrors(page);
    await page.goto(path);

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.area-message')).toContainText('Fase em construção');
    await expect(page.locator('.area-message')).toHaveCSS('background-color', SURFACE_LIGHT);
    // O design system é carregado uma vez pelo layout.
    await expect
      .poll(() => page.evaluate(() => Boolean(customElements.get('ds-theme-toggle'))))
      .toBe(true);

    await expectAccessible(page);
    expect(errors).toEqual([]);
  });
}

test('navega da home a uma área, volta e entra em outra', async ({ page }) => {
  const errors = failOnBrowserErrors(page);
  await page.goto('/');

  // Na home o caminho do recrutador é o personagem com a frase dele: escolher
  // o personagem abre o painel, e o "Entrar" leva à área.
  await page.getByRole('button', { name: 'Estou contratando' }).click();
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  await expect(page.locator('mfe-recrutador')).toContainText('Fase em construção');

  // As páginas internas não têm menu: troca-se de área voltando à escolha de perfil.
  await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Técnico' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Quero ver o código' }).click();
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/tecnico\/$/);
  await expect(page.locator('mfe-tecnico')).toContainText('Fase em construção');
  await expect(page.locator('header a, main nav')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('cada rota carrega só o MFE dela', async ({ page }) => {
  const mfeRequests: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith('/_mfe/')) mfeRequests.push(pathname.split('/')[2] ?? '');
  });

  await page.goto('/recrutador/');
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'recruiter');

  expect(new Set(mfeRequests)).toEqual(new Set(['vue']));
});

test('rota em inglês usa o idioma na página e no MFE', async ({ page }) => {
  await page.goto('/en/recruiter/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('mfe-recrutador')).toContainText('Stage under construction');
  await expect(page.locator('h1')).toHaveText('Recruiter');
});

test('caminho desconhecido responde 404', async ({ page }) => {
  const response = await page.goto('/nao-existe/');
  expect(response?.status()).toBe(404);
});

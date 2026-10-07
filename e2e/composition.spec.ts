import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ACCENT_LIGHT = 'rgb(29, 78, 216)';

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
  test(`${path} renderiza o olá do MFE ${framework} dentro do shell`, async ({ page }) => {
    const errors = failOnBrowserErrors(page);
    await page.goto(path);

    // O MFE avisou o shell pelo evento de packages/contracts.
    await expect(page.locator('main')).toHaveAttribute('data-ready', area);

    const mfe = page.locator(tag);
    await expect(mfe).toHaveAttribute('locale', 'pt-BR');
    // "Olá" vem de packages/content; o selo é o componente do design system.
    await expect(mfe).toContainText('Olá');
    const badge = mfe.locator('ds-badge');
    await expect(badge).toHaveText(framework);
    await expect(badge).toHaveCSS('background-color', ACCENT_LIGHT);

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
    await expect(page.locator('.hello')).toContainText('Olá');

    const badge = page.locator('ds-badge');
    await expect(badge).toHaveText('Next.js');
    await expect(badge).toHaveCSS('background-color', ACCENT_LIGHT);
    await expect
      .poll(() => page.evaluate(() => Boolean(customElements.get('ds-badge'))))
      .toBe(true);

    await expectAccessible(page);
    expect(errors).toEqual([]);
  });
}

test('navega da home pelas três áreas de MFE e volta ao Next.js', async ({ page }) => {
  const errors = failOnBrowserErrors(page);
  await page.goto('/');

  // Na home o caminho do recrutador é o personagem com a frase dele.
  await page.getByRole('link', { name: /Estou contratando/ }).click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  await expect(page.locator('mfe-recrutador')).toContainText('Olá');

  await page.getByRole('link', { name: 'Técnico' }).click();
  await expect(page).toHaveURL(/\/tecnico\/$/);
  await expect(page.locator('mfe-tecnico')).toContainText('Olá');

  await page.getByRole('link', { name: 'Clientes' }).click();
  await expect(page).toHaveURL(/\/clientes\/$/);
  await expect(page.locator('mfe-clientes')).toContainText('Olá');

  await page.getByRole('link', { name: 'Como foi feito' }).click();
  await expect(page).toHaveURL(/\/como-foi-feito\/$/);
  await expect(page.locator('h1')).toHaveText('Como foi feito');

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
  await expect(page.locator('mfe-recrutador')).toContainText('Hello');
  await expect(page.locator('h1')).toHaveText('Recruiter');
});

test('caminho desconhecido responde 404', async ({ page }) => {
  const response = await page.goto('/nao-existe/');
  expect(response?.status()).toBe(404);
});

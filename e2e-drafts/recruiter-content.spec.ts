import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Página do recrutador COM conteúdo. Só existe em build com rascunhos
// (`pnpm test:e2e:drafts`); o e2e normal roda sobre o build de produção, onde a
// área ainda mostra a tela "em construção". Quando houver conteúdo publicado,
// este spec passa para e2e/.
const page1 = (page: Page) => page.locator('mfe-recrutador');

test.use({ viewport: { width: 1280, height: 800 } });

for (const colorScheme of ['light', 'dark'] as const) {
  test(`a página com conteúdo passa na verificação de acessibilidade (${colorScheme})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error') errors.push(entry.text());
    });
    await page.goto('/recrutador/');

    await expect(page.locator('main.area-stage')).toHaveAttribute('data-content', '');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recrutador');
    await expect(page1(page).getByRole('heading', { level: 2 })).toHaveText([
      'Dario Reis',
      'Resumo',
      'Stack',
      'Experiência',
      'Projetos em destaque',
      'Formação e certificados',
    ]);
    await expect(page1(page).getByText('Dados de exemplo')).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    // Com os destaques abertos e outra categoria escolhida.
    await page1(page).locator('summary').first().click();
    await page1(page).getByRole('button', { name: 'Back-end' }).click();
    const open = await new AxeBuilder({ page }).analyze();
    expect(open.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('o palco é do documento: personagem, título, volta e pausa continuam do shell', async ({
  page,
}) => {
  await page.goto('/en/recruiter/');
  await expect(page.locator('main > picture > img.area-figure')).toHaveAttribute(
    'src',
    '/_home/personas/recruiter.webp',
  );
  await expect(page.getByRole('link', { name: 'Back to profile selection' })).toHaveAttribute(
    'href',
    '/en/',
  );
  await expect(page1(page).getByRole('heading', { name: 'Experience' })).toBeAttached();
  // O personagem acompanha a rolagem ao lado do conteúdo.
  await page.mouse.wheel(0, 900);
  await expect(page.locator('img.area-figure')).toBeInViewport();
});

test('com movimento, os blocos entram ao rolar e a página não desloca o layout', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { cls: number }).cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) (window as unknown as { cls: number }).cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/recrutador/');
  const blocks = page1(page).locator('.block');
  // A ficha, que abre a página, nunca fica invisível.
  await expect(blocks.first()).toHaveCSS('opacity', '1');
  const last = blocks.last();
  await expect(last).toHaveCSS('opacity', '0');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveCSS('opacity', '1');
  await expect(last).toHaveClass(/seen/);
  expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.1);
});

test('a pausa do canto para o xadrez dentro do microfrontend', async ({ page }) => {
  await page.goto('/recrutador/');
  const checker = page1(page).locator('.checker');
  await expect(checker).toHaveCSS('animation-play-state', 'running');
  await page.getByRole('checkbox', { name: 'Pausar animação' }).check();
  await expect(checker).toHaveCSS('animation-play-state', 'paused');
});

test('com movimento reduzido nada nasce oculto nem se mexe', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/recrutador/');
  await expect(page1(page).locator('.block').first()).toBeVisible();
  const hidden = await page1(page)
    .locator('.block')
    .evaluateAll(
      (blocks) => blocks.filter((block) => getComputedStyle(block).opacity !== '1').length,
    );
  expect(hidden).toBe(0);
  await expect(page1(page).locator('.checker')).toHaveCSS('animation-name', 'none');
  await context.close();
});

test('pelo teclado: o filtro e as faces do projeto respondem, com foco visível', async ({
  page,
}) => {
  await page.goto('/recrutador/');
  const filter = page1(page).getByRole('button', { name: 'Front-end' });
  await filter.focus();
  await expect(filter).not.toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Enter');
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  await expect(page1(page).locator('.skill-name')).toHaveText(['TypeScript', 'Vue', 'React']);

  const challenge = page1(page).getByRole('button', { name: 'Desafio' }).first();
  await challenge.focus();
  await page.keyboard.press('Space');
  await expect(page1(page).locator('.facet-text').first()).toContainText('Desafio de exemplo');
});

test('a página baixa no máximo dois arquivos de fonte', async ({ page }) => {
  const fonts = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.add(new URL(request.url()).pathname);
  });
  await page.goto('/recrutador/');
  await page.waitForLoadState('networkidle');
  expect(fonts.size).toBeLessThanOrEqual(2);
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  test('cabe na largura e o contato acompanha a rolagem', async ({ page }) => {
    await page.goto('/es/reclutador/');
    await expect(page1(page).getByRole('heading', { name: 'Experiencia' })).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    await page1(page).getByRole('heading', { name: 'Experiencia' }).scrollIntoViewIfNeeded();
    await expect(page1(page).getByRole('navigation', { name: 'Contacto' })).toBeInViewport();
  });
});

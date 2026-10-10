import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Página da área do cliente (docs/plans/clientes-conteudo.md), para quem procura
// alguém para fazer um projeto. Enquanto não há conteúdo publicado, vai ao ar
// com os dados de exemplo e a faixa que os identifica em cada bloco.
const area = (page: Page) => page.locator('mfe-clientes');

test.use({ viewport: { width: 1280, height: 800 } });

for (const colorScheme of ['light', 'dark'] as const) {
  test(`a página passa na verificação de acessibilidade (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error') errors.push(entry.text());
    });
    await page.goto('/clientes/');

    await expect(page.locator('main.area-stage')).toHaveAttribute('data-content', '');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clientes');
    await expect(area(page).getByRole('heading', { level: 2 })).toHaveText([
      'Tem um projeto? Eu tiro do papel.',
      'O que eu faço por você',
      'Como funciona',
      'Projetos e resultados',
      'O que dizem',
      'Investimento e prazos',
      'Perguntas frequentes',
      'Vamos começar?',
    ]);

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    // Com uma pergunta aberta.
    await area(page).locator('summary').first().click();
    const open = await new AxeBuilder({ page }).analyze();
    expect(open.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('fala com quem contrata: serviços, etapas, resultado e condições, sem valores', async ({
  page,
}) => {
  await page.goto('/clientes/');
  await expect(area(page).locator('.services .card')).toHaveCount(3);
  await expect(area(page).locator('.services .card').first()).toContainText('O que está incluído');
  // As etapas são numeradas, da conversa ao suporte.
  await expect(area(page).locator('ol.steps > li')).toHaveCount(5);
  await expect(area(page).locator('ol.steps .level')).toHaveText([
    'Etapa 1',
    'Etapa 2',
    'Etapa 3',
    'Etapa 4',
    'Etapa 5',
  ]);
  await expect(area(page).locator('.case').first().locator('dt')).toHaveText([
    'O cenário',
    'O que mudou',
  ]);
  await expect(area(page).locator('.models .card')).toHaveCount(3);
  await expect(area(page).locator('.models .card').first()).toContainText('Prazo típico');
  // Nada de preço: nem cifrão, nem número com moeda.
  expect(await area(page).evaluate((host) => host.shadowRoot?.textContent ?? '')).not.toMatch(
    /R\$|US\$|€|\d+\s?(reais|dólares)/,
  );
});

test('os dados fictícios levam a faixa de exemplo; abertura e chamada não', async ({ page }) => {
  await page.goto('/clientes/');
  const flagged = await area(page)
    .locator('.example')
    .evaluateAll((banners) =>
      banners.map((banner) => banner.closest('section')?.getAttribute('aria-labelledby')),
    );
  expect(flagged).toEqual([
    'services-title',
    'process-title',
    'cases-title',
    'testimonials-title',
    'engagement-title',
    'faq-title',
  ]);
  // Os depoimentos de exemplo não se passam por elogio de verdade.
  await expect(area(page).locator('figure figcaption').first()).toContainText('Cliente Exemplo');
});

test('o pedido de orçamento está em três pontos, com o WhatsApp primeiro', async ({ page }) => {
  await page.goto('/clientes/');
  const groups = area(page).getByRole('group', { name: 'Pedir orçamento' });
  await expect(groups).toHaveCount(3);
  for (const group of await groups.all()) {
    await expect(group.getByRole('link')).toHaveText([
      'Pedir orçamento pelo WhatsApp',
      'Pedir orçamento por e-mail',
    ]);
  }
  await expect(groups.first().getByRole('link').last()).toHaveAttribute('href', /^mailto:/);
  // Os textos acompanham o idioma.
  await page.goto('/en/clients/');
  await expect(
    area(page).getByRole('link', { name: 'Request a quote on WhatsApp' }).first(),
  ).toBeVisible();
  await page.goto('/es/clientes/');
  await expect(area(page).getByRole('heading', { name: '¿Empezamos?' })).toBeAttached();
});

test('as perguntas abrem e fecham pelo teclado, com foco visível', async ({ page }) => {
  await page.goto('/clientes/');
  const question = area(page).locator('details').first();
  const summary = question.locator('summary');
  await expect(question).not.toHaveAttribute('open');
  await summary.focus();
  await expect(summary).not.toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Enter');
  await expect(question).toHaveAttribute('open', '');
  await expect(question.locator('p')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(question).not.toHaveAttribute('open');
});

test('com movimento, as janelas abrem ao rolar e a página não desloca o layout', async ({
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
  await page.goto('/clientes/');
  // A abertura nunca fica invisível.
  await expect(area(page).locator('.hero')).toHaveCSS('opacity', '1');
  const last = area(page).locator('.cta');
  await expect(last).toHaveCSS('opacity', '0');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveCSS('opacity', '1');
  await expect(last).toHaveClass(/open/);
  // O número de cada etapa termina no valor certo depois de contar.
  await area(page).locator('ol.steps').scrollIntoViewIfNeeded();
  await expect(area(page).locator('ol.steps .level').last()).toHaveText('Etapa 5');
  expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.1);
});

test('o cartão de serviço inclina seguindo o ponteiro e volta ao sair', async ({ page }) => {
  await page.goto('/clientes/');
  const card = area(page).locator('.services .card').first();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  if (!box) throw new Error('cartão sem caixa');
  const tilt = () => card.evaluate((element) => (element as HTMLElement).style.cssText);
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.2);
  await expect.poll(tilt).toContain('--tilt-x');
  await page.mouse.move(5, 5);
  await expect.poll(tilt).not.toContain('--tilt-x');
});

test('a pausa do canto para o portal, o pulso do botão e as ondas', async ({ page }) => {
  await page.goto('/clientes/');
  const state = (selector: string) =>
    area(page)
      .locator(selector)
      .first()
      .evaluate((element) => getComputedStyle(element).animationPlayState);
  for (const selector of ['.portal', '.quote', '.cta']) {
    expect(await state(selector), selector).toBe('running');
  }
  await page.getByRole('checkbox', { name: 'Pausar animação' }).check();
  for (const selector of ['.portal', '.quote', '.cta']) {
    expect(await state(selector), selector).toBe('paused');
  }
});

test('com movimento reduzido nada nasce oculto nem se mexe', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/clientes/');
  await expect(area(page).locator('.hero')).toBeVisible();
  const hidden = await area(page)
    .locator('.window')
    .evaluateAll(
      (panels) => panels.filter((panel) => getComputedStyle(panel).opacity !== '1').length,
    );
  expect(hidden).toBe(0);
  const moving = await area(page)
    .locator('.portal, .quote, .cta')
    .evaluateAll(
      (nodes) => nodes.filter((node) => getComputedStyle(node).animationName !== 'none').length,
    );
  expect(moving).toBe(0);
  await context.close();
});

test('a página baixa no máximo dois arquivos de fonte', async ({ page }) => {
  const fonts = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.add(new URL(request.url()).pathname);
  });
  await page.goto('/clientes/');
  await page.waitForLoadState('networkidle');
  expect(fonts.size).toBeLessThanOrEqual(2);
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  test('cabe na largura e os alvos de toque têm 44 px', async ({ page }) => {
    await page.goto('/es/clientes/');
    await expect(area(page).getByRole('heading', { name: 'Cómo funciona' })).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    for (const control of await area(page).locator('a.quote, summary').all()) {
      expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
  });
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Página da área da comunidade (ADR 0013, docs/plans/comunidade-conteudo.md): a
// única área com conteúdo que é página do Next.js, e não microfrontend. Não tem
// JavaScript próprio: as animações são CSS.
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
    await page.goto('/comunidade/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Comunidade');
    await expect(page.getByRole('heading', { level: 2 }).first()).toHaveAccessibleName('Artigos');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      // A esfera numerada de cada título é enfeite, fora do nome acessível.
      /^1Artigos$/,
      /^2Código aberto$/,
      /^3Vitrine do design system$/,
      /^4Como acompanhar e participar$/,
    ]);
    // O título usa a cor da área, preto no tema claro e branco no escuro.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
      'background-color',
      colorScheme === 'light' ? 'rgb(12, 14, 19)' : 'rgb(255, 255, 255)',
    );

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('artigos: data, idioma, assuntos e o tempo de leitura como medidor', async ({ page }) => {
  await page.goto('/comunidade/');
  const articles = page.locator('.c-articles > li');
  await expect(articles).toHaveCount(3);
  // Mais recente primeiro, com a data escrita no idioma da página.
  const first = articles.first();
  await expect(first.locator('time')).toHaveAttribute('datetime', '2026-09-12');
  await expect(first.locator('time')).toHaveText('12 de setembro de 2026');
  await expect(first).toContainText('Escrito em Português (Brasil)');
  await expect(first.getByRole('link')).toHaveAttribute('href', /^https:\/\/example\.com\//);
  // O medidor repete em desenho o número, que está em texto: o maior enche a barra.
  await expect(first.locator('.c-power strong')).toHaveText('9 min');
  await expect(first.locator('.c-power-track')).toHaveAttribute('aria-hidden', 'true');
  const widths = await page
    .locator('.c-power-track i')
    .evaluateAll((bars) => bars.map((bar) => (bar as HTMLElement).style.inlineSize));
  expect(widths).toEqual(['100%', '67%', '44%']);
  await expect(page.locator('.c-total')).toHaveText('19 min de leitura no total');
  // Os assuntos usam o selo do design system.
  await expect(first.locator('ds-badge')).toHaveText(['arquitetura', 'front-end']);
});

test('código aberto: o repositório deste site é real e fica fora da faixa de exemplo', async ({
  page,
}) => {
  await page.goto('/comunidade/');
  const section = page.locator('section[aria-labelledby="c-projects"]');
  const capsules = section.locator('.c-capsule');
  await expect(capsules).toHaveCount(3);

  const site = capsules.first();
  await expect(site.getByRole('heading')).toHaveText('Este site');
  await expect(site.getByRole('link', { name: 'Ver repositório' })).toHaveAttribute(
    'href',
    'https://github.com/darioreisjr/portfolio_2027',
  );
  // A faixa vem depois da cápsula real e antes das de exemplo.
  const order = await section.evaluate((element) =>
    [...element.querySelectorAll('.c-capsule h3, .c-example')].map((node) =>
      node.matches('.c-example') ? 'faixa' : node.textContent,
    ),
  );
  expect(order).toEqual(['Este site', 'faixa', 'Projeto Exemplo Um', 'Projeto Exemplo Dois']);
  await expect(capsules.nth(1).locator('ds-badge')).toHaveText('Ativo');
  await expect(capsules.nth(2).locator('ds-badge')).toHaveText('Mantido');
});

test('os blocos fictícios levam a faixa de exemplo; a vitrine, que é real, não', async ({
  page,
}) => {
  await page.goto('/comunidade/');
  const flagged = await page
    .locator('.c-example')
    .evaluateAll((banners) =>
      banners.map((banner) => banner.closest('section')?.getAttribute('aria-labelledby')),
    );
  expect(flagged).toEqual(['c-articles', 'c-projects', 'c-join']);
});

test('vitrine: as peças de verdade, e as amostras acompanham o tema', async ({ page }) => {
  await page.goto('/comunidade/');
  const showcase = page.locator('section[aria-labelledby="c-showcase"]');
  // O selo é o custom element do design system, já registrado.
  await expect(showcase.locator('ds-badge')).toHaveText('exemplo');
  expect(await page.evaluate(() => Boolean(customElements.get('ds-badge')))).toBe(true);
  // Uma amostra por token, com o nome do token ao lado.
  await expect(showcase.locator('.c-swatches').first().locator('code')).toHaveText([
    '--color-area-recruiter',
    '--color-area-tech',
    '--color-area-client',
    '--color-area-community',
  ]);
  await expect(showcase.locator('.c-type li')).toHaveCount(4);

  const surface = showcase.locator('.c-swatches').nth(1).locator('span').first();
  await expect(surface).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Tema escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(surface).toHaveCSS('background-color', 'rgb(12, 14, 19)');
});

test('como participar: canais, o que é bem-vindo e o caminho para "Como foi feito"', async ({
  page,
}) => {
  await page.goto('/comunidade/');
  const join = page.locator('section[aria-labelledby="c-join"]');
  await expect(join.locator('.c-channels a')).toHaveText(['LinkedIn', 'GitHub']);
  await expect(join.locator('.c-welcome li')).toHaveCount(4);
  await join.getByRole('link', { name: 'Como este site foi feito' }).click();
  await expect(page).toHaveURL(/\/como-foi-feito\/$/);
  await expect(page.locator('h1')).toHaveText('Como foi feito');
});

test('os textos acompanham o idioma', async ({ page }) => {
  await page.goto('/en/community/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    /Articles$/,
    /Open source$/,
    /Design system showcase$/,
    /How to follow and take part$/,
  ]);
  await expect(page.locator('.c-articles time').first()).toHaveText('September 12, 2026');
  await expect(page.getByRole('link', { name: 'Back to profile selection' })).toHaveAttribute(
    'href',
    '/en/',
  );
  await page.goto('/es/comunidad/');
  await expect(page.getByRole('heading', { name: 'Código abierto' })).toBeVisible();
});

test('a página tem folha própria: a home não a carrega, e ela dispensa a das páginas internas', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(requested.filter((path) => path.includes('community.css'))).toEqual([]);

  requested.length = 0;
  await page.goto('/comunidade/');
  await page.waitForLoadState('networkidle');
  expect(requested).toContain('/_home/community.css');
  expect(requested.filter((path) => path.includes('areas.css'))).toEqual([]);
  // Nenhum script a mais que a home: a página não tem JavaScript próprio.
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((list) => list.map((script) => (script as HTMLScriptElement).src));
  expect(new Set(scripts).size).toBeLessThanOrEqual(8);
});

test('a aura e as linhas de velocidade se movem, e a pausa do canto as para', async ({ page }) => {
  await page.goto('/comunidade/');
  const pause = page.getByRole('checkbox', { name: 'Pausar animação' });
  await expect(pause).toBeVisible();
  for (const selector of ['.c-aura', '.c-speed']) {
    await expect(page.locator(selector), selector).toHaveCSS('animation-play-state', 'running');
  }
  // A pausa funciona pelo teclado.
  await pause.focus();
  await page.keyboard.press('Space');
  await expect(pause).toBeChecked();
  for (const selector of ['.c-aura', '.c-speed']) {
    await expect(page.locator(selector), selector).toHaveCSS('animation-play-state', 'paused');
  }
});

test('com movimento reduzido nada se mexe e não há botão de pausa', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/comunidade/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const moving = await page
    .locator('.community *')
    .evaluateAll(
      (nodes) => nodes.filter((node) => getComputedStyle(node).animationName !== 'none').length,
    );
  expect(moving).toBe(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  // Sem animação por rolagem, as seções aparecem inteiras.
  await expect(page.locator('.community > section').last()).toHaveCSS('opacity', '1');
  await context.close();
});

test('a abertura não nasce oculta e a página não desloca o layout', async ({ page }) => {
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
  await page.goto('/comunidade/');
  await expect(page.locator('.c-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.c-title')).toHaveCSS('animation-name', 'none');
  await page.locator('.c-back').scrollIntoViewIfNeeded();
  await expect(page.locator('.community > section').last()).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.1);
});

test('a página baixa no máximo dois arquivos de fonte', async ({ page }) => {
  const fonts = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.add(new URL(request.url()).pathname);
  });
  await page.goto('/comunidade/');
  await page.waitForLoadState('networkidle');
  expect(fonts.size).toBeLessThanOrEqual(2);
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  test('cabe na largura e o grupo do canto não cobre o botão de volta', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 740 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/es/comunidad/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const [back, dock] = [
      await page.locator('.c-back').boundingBox(),
      await page.locator('.ds-dock').boundingBox(),
    ];
    expect((back?.y ?? 0) + (back?.height ?? 0)).toBeLessThanOrEqual(dock?.y ?? 0);
    for (const link of await page.locator('.c-capsule-body a, .c-channels a, .c-back').all()) {
      expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    await context.close();
  });
});

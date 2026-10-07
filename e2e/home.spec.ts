import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const homes = [
  {
    path: '/',
    lang: 'pt-BR',
    title: 'Escolha seu caminho',
    hrefs: ['/recrutador/', '/tecnico/', '/clientes/', '/comunidade/'],
  },
  {
    path: '/en/',
    lang: 'en',
    title: 'Choose your path',
    hrefs: ['/en/recruiter/', '/en/tech/', '/en/clients/', '/en/community/'],
  },
  {
    path: '/es/',
    lang: 'es',
    title: 'Elige tu camino',
    hrefs: ['/es/reclutador/', '/es/tecnico/', '/es/clientes/', '/es/comunidad/'],
  },
  {
    path: '/pt-pt/',
    lang: 'pt-PT',
    title: 'Escolha o seu caminho',
    hrefs: ['/pt-pt/recrutador/', '/pt-pt/tecnico/', '/pt-pt/clientes/', '/pt-pt/comunidade/'],
  },
];

const personas = (page: Page): Locator => page.locator('a.persona');
const caption = (persona: Locator): Locator => persona.locator('.persona-caption');

async function expectAccessible(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test.describe('home em tela larga (palco)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  for (const { path, lang, title, hrefs } of homes) {
    test(`${path} mostra os quatro caminhos no idioma`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(path);

      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(personas(page)).toHaveCount(4);
      for (const [index, href] of hrefs.entries()) {
        await expect(personas(page).nth(index)).toHaveAttribute('href', href);
      }
      await expect(page.locator('a.persona ds-badge')).toHaveCount(4);
      // As quatro silhuetas carregaram de verdade.
      const loaded = await page
        .locator('img.persona-figure')
        .evaluateAll((images) =>
          images.map((image) => (image as HTMLImageElement).naturalWidth > 0),
        );
      expect(loaded).toEqual([true, true, true, true]);

      await expectAccessible(page);
      expect(errors).toEqual([]);
    });
  }

  test('diz a tecnologia de cada área e a frase de cada perfil', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a.persona ds-badge')).toHaveText([
      'Feito em Vue',
      'Feito em Angular',
      'Feito em React',
      'Feito em Next.js',
    ]);
    await expect(page.locator('.persona-phrase')).toHaveText([
      'Estou contratando',
      'Quero ver o código',
      'Tenho um projeto',
      'Vim aprender e trocar ideias',
    ]);
  });

  test('começa sem destaque e destaca o personagem sob o mouse', async ({ page }) => {
    await page.goto('/');
    const [first, second] = [personas(page).nth(0), personas(page).nth(1)];

    for (const persona of await personas(page).all()) {
      await expect(caption(persona)).toHaveCSS('opacity', '0');
    }

    await second.hover();
    await expect(caption(second)).toHaveCSS('opacity', '1');
    await expect(caption(first)).toHaveCSS('opacity', '0');
    // Os outros esmaecem.
    await expect(first.locator('.persona-figure')).not.toHaveCSS('opacity', '1');
  });

  test('teclado: Tab destaca, setas andam, Enter abre', async ({ page }) => {
    await page.goto('/');
    // O primeiro Tab cai no seletor de tema, que vem antes na tela e no documento.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Tema escuro' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(personas(page).nth(0)).toBeFocused();
    await expect(caption(personas(page).nth(0))).toHaveCSS('opacity', '1');

    await page.keyboard.press('ArrowRight');
    await expect(personas(page).nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(personas(page).nth(3)).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tecnico\/$/);
  });

  test('tema escuro passa na verificação de acessibilidade', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');
    await personas(page).nth(2).focus();
    await expectAccessible(page);
    await context.close();
  });

  test('movimento reduzido desliga a transição', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.persona-figure').first()).toHaveCSS('transition-duration', '0s');
    await context.close();
  });

  test('sem JavaScript, o personagem continua sendo um link', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await personas(page).nth(2).click();
    await expect(page).toHaveURL(/\/clientes\/$/);
    await context.close();
  });

  test('liga para "Como foi feito"', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Como foi feito' }).click();
    await expect(page).toHaveURL(/\/como-foi-feito\/$/);
  });
});

test.describe('home em tela larga com toque', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

  test('primeiro toque destaca, segundo abre a área', async ({ page }) => {
    await page.goto('/');
    const recruiter = personas(page).nth(0);

    await recruiter.tap();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(recruiter).toHaveAttribute('data-active', '');
    await expect(caption(recruiter)).toHaveCSS('opacity', '1');

    // Tocar em outro troca o destaque, sem navegar.
    const client = personas(page).nth(2);
    await client.tap();
    await expect(client).toHaveAttribute('data-active', '');
    await expect(recruiter).not.toHaveAttribute('data-active');

    await client.tap();
    await expect(page).toHaveURL(/\/clientes\/$/);
  });
});

test.describe('home no celular (carrossel)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('mostra um personagem por vez, com a legenda visível', async ({ page }) => {
    await page.goto('/');
    const [first, second] = [personas(page).nth(0), personas(page).nth(1)];

    await expect(caption(first)).toHaveCSS('opacity', '1');
    await expect(first).toBeInViewport({ ratio: 0.9 });
    await expect(second).not.toBeInViewport({ ratio: 0.5 });

    // A página não rola de lado; só a lista de personagens.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await expectAccessible(page);
  });

  test('desliza até o próximo e um toque abre a área', async ({ page }) => {
    await page.goto('/');
    const second = personas(page).nth(1);

    await second.scrollIntoViewIfNeeded();
    await expect(second).toBeInViewport({ ratio: 0.9 });
    // O pontinho do personagem à vista acompanha o deslize.
    await expect(page.locator('ul.personas')).toHaveAttribute('data-slide', '1');

    await second.tap();
    await expect(page).toHaveURL(/\/tecnico\/$/);
  });
});

// ---------------------------------------------------------------------------
// Cenário de sakura
// ---------------------------------------------------------------------------

const petalStates = (page: Page) =>
  page.locator('.sakura-petal').evaluateAll((petals) =>
    petals
      .map((petal) => getComputedStyle(petal))
      .filter((style) => style.display !== 'none')
      .map((style) => ({ name: style.animationName, state: style.animationPlayState })),
  );

/**
 * Pior contraste entre a cor de um texto e os pixels que estão de fato atrás
 * dele. O axe não mede texto sobre degradê, galho ou pétala; este teste mede.
 * O texto fica transparente, a tela é capturada e lida em um canvas.
 */
async function worstContrast(page: Page, selectors: string[]): Promise<Record<string, number>> {
  const targets = await page.evaluate(
    (list) =>
      list.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Sem elemento para ${selector}`);
        // Só a área do texto: os cantos arredondados da névoa não têm letra.
        const range = document.createRange();
        range.selectNodeContents(element);
        const { x, y, width, height } = range.getBoundingClientRect();
        // Coordenadas do documento: a captura é da página inteira.
        return {
          selector,
          x: x + scrollX,
          y: y + scrollY,
          width,
          height,
          color: getComputedStyle(element).color,
        };
      }),
    selectors,
  );

  await page.addStyleTag({
    content:
      '.home, .home * { color: transparent !important; text-decoration-color: transparent !important; }' +
      '.home img, .home ds-badge, .persona-enter, .home-motion input { visibility: hidden !important; }',
  });
  const screenshot = (await page.screenshot({ scale: 'css', fullPage: true })).toString('base64');

  return page.evaluate(
    async ({ image, list }) => {
      const picture = new Image();
      picture.src = `data:image/png;base64,${image}`;
      await picture.decode();
      const canvas = document.createElement('canvas');
      canvas.width = picture.width;
      canvas.height = picture.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Sem canvas 2d');
      context.drawImage(picture, 0, 0);

      const luminance = (red: number, green: number, blue: number) => {
        const [r, g, b] = [red, green, blue].map((value) => {
          const unit = value / 255;
          return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
      };

      const result: Record<string, number> = {};
      for (const target of list) {
        const [red = 0, green = 0, blue = 0] = (target.color.match(/[\d.]+/g) ?? []).map(Number);
        const text = luminance(red, green, blue);
        const { data } = context.getImageData(
          Math.max(0, Math.floor(target.x)),
          Math.max(0, Math.floor(target.y)),
          Math.max(1, Math.floor(target.width)),
          Math.max(1, Math.floor(target.height)),
        );
        let worst = Infinity;
        for (let at = 0; at < data.length; at += 4) {
          const behind = luminance(data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0);
          const [high, low] = text > behind ? [text, behind] : [behind, text];
          worst = Math.min(worst, (high + 0.05) / (low + 0.05));
        }
        result[target.selector] = Number(worst.toFixed(2));
      }
      return result;
    },
    { image: screenshot, list: targets },
  );
}

const textBlocks = [
  '.home h1',
  '.persona .persona-phrase',
  '.persona .persona-summary',
  '.home-more a',
  '.home-motion',
];

test.describe('cenário de sakura em tela larga', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  test('é decorativo: fora da árvore de acessibilidade, do foco e dos cliques', async ({
    page,
  }) => {
    await page.goto('/');
    const scene = page.locator('.sakura');

    await expect(scene).toHaveAttribute('aria-hidden', 'true');
    await expect(scene).toHaveCSS('pointer-events', 'none');
    await expect(scene.locator('a, button, input, [tabindex]')).toHaveCount(0);
    await expect(scene.locator('.sakura-branch')).toHaveCount(2);
  });

  test('tem vinte pétalas caindo', async ({ page }) => {
    await page.goto('/');
    const states = await petalStates(page);

    expect(states).toHaveLength(20);
    for (const state of states) expect(state).toEqual({ name: 'sakura-fall', state: 'running' });
  });

  test('a animação pausa e volta pelo teclado', async ({ page }) => {
    await page.goto('/');
    const pause = page.getByRole('checkbox', { name: 'Pausar animação' });

    await pause.focus();
    await page.keyboard.press('Space');
    await expect(pause).toBeChecked();
    expect((await petalStates(page)).every((petal) => petal.state === 'paused')).toBe(true);
    await expect(page.locator('.sakura-branch').first()).toHaveCSS(
      'animation-play-state',
      'paused',
    );

    await page.keyboard.press('Space');
    expect((await petalStates(page)).every((petal) => petal.state === 'running')).toBe(true);
  });

  test('movimento reduzido: pétalas paradas à vista e sem controle de pausa', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/');

    const states = await petalStates(page);
    expect(states).toHaveLength(20);
    for (const state of states) expect(state.name).toBe('none');
    await expect(page.locator('.sakura-branch').first()).toHaveCSS('animation-name', 'none');

    const inView = await page.locator('.sakura-petal').evaluateAll(
      (petals) =>
        petals.filter((petal) => {
          const { top, bottom } = petal.getBoundingClientRect();
          return top >= 0 && bottom <= innerHeight;
        }).length,
    );
    expect(inView).toBeGreaterThanOrEqual(15);

    await expect(page.locator('.home-motion')).toBeHidden();
    await context.close();
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`o texto tem contraste AA sobre o cenário (${colorScheme})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme,
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('checkbox').check();
      // Com foco de teclado, a legenda do primeiro personagem fica visível.
      await page.getByRole('button', { name: 'Tema escuro' }).focus();
      await page.keyboard.press('Tab');
      await expect(personas(page).first()).toBeFocused();
      await expect(caption(personas(page).first())).toHaveCSS('opacity', '1');

      const contrasts = await worstContrast(page, textBlocks);
      for (const [block, value] of Object.entries(contrasts)) {
        expect(value, `${block} em ${colorScheme}`).toBeGreaterThanOrEqual(4.5);
      }
      await context.close();
    });
  }
});

test.describe('cenário de sakura no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tem dez pétalas e não cria rolagem lateral', async ({ page }) => {
    await page.goto('/');

    expect(await petalStates(page)).toHaveLength(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`o texto tem contraste AA sobre o cenário (${colorScheme})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        colorScheme,
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('checkbox').check();

      const contrasts = await worstContrast(page, textBlocks);
      for (const [block, value] of Object.entries(contrasts)) {
        expect(value, `${block} em ${colorScheme}`).toBeGreaterThanOrEqual(4.5);
      }
      await context.close();
    });
  }
});

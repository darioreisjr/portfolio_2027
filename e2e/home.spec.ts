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
const items = (page: Page): Locator => page.locator('ul.personas > li');
const phrase = (persona: Locator): Locator => persona.locator('.persona-phrase');
const enter = (page: Page): Locator => page.getByRole('link', { name: 'Entrar' });
const back = (page: Page): Locator => page.getByRole('button', { name: 'Voltar' });

/** Abre a home e espera o JavaScript assumir: até lá o personagem é um link. */
async function openHome(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await expect(personas(page).first()).toHaveAttribute('role', 'button');
}

async function expectAccessible(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

/** O personagem `index` está escolhido: só ele à vista, com o painel aberto. */
async function expectSelected(page: Page, index: number): Promise<void> {
  await expect(page.locator('ul.personas')).toHaveAttribute('data-selected', '');
  await expect(items(page).nth(index)).toHaveAttribute('data-selected', '');
  await expect(personas(page).nth(index)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('a.persona:visible')).toHaveCount(1);
  await expect(page.locator('.persona-actions:visible')).toHaveCount(1);
  await expect(items(page).nth(index).locator('ds-badge')).toBeVisible();
}

async function expectNoneSelected(page: Page): Promise<void> {
  await expect(page.locator('[data-selected]')).toHaveCount(0);
  await expect(page.locator('a.persona:visible')).toHaveCount(4);
  await expect(page.locator('.persona-actions:visible')).toHaveCount(0);
  await expect(page.locator('a.persona[aria-expanded="false"]')).toHaveCount(4);
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
      await openHome(page, path);

      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveText(title);
      await expect(personas(page)).toHaveCount(4);
      for (const [index, href] of hrefs.entries()) {
        await expect(personas(page).nth(index)).toHaveAttribute('href', href);
        await expect(page.locator('.persona-enter').nth(index)).toHaveAttribute('href', href);
      }
      // As quatro figuras carregaram de verdade. Três são sob demanda, então
      // podem chegar um instante depois da página.
      await expect
        .poll(() =>
          page
            .locator('img.persona-figure')
            .evaluateAll((images) =>
              images.map((image) => (image as HTMLImageElement).naturalWidth > 0),
            ),
        )
        .toEqual([true, true, true, true]);

      await expectNoneSelected(page);
      await expectAccessible(page);
      expect(errors).toEqual([]);
    });
  }

  test('diz a frase de cada perfil e guarda a tecnologia para o painel', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.persona-phrase')).toHaveText([
      'Estou contratando',
      'Quero ver o código',
      'Tenho um projeto',
      'Vim aprender e trocar ideias',
    ]);
    await expect(page.locator('.persona-actions ds-badge')).toHaveText([
      'Feito em Vue',
      'Feito em Angular',
      'Feito em React',
      'Feito em Next.js',
    ]);
    await expect(page.locator('.persona-actions ds-badge:visible')).toHaveCount(0);
  });

  test('em repouso não há texto; a frase aparece só no personagem sob o mouse', async ({
    page,
  }) => {
    await openHome(page);
    const [first, second] = [personas(page).nth(0), personas(page).nth(1)];

    for (const persona of await personas(page).all()) {
      await expect(phrase(persona)).toHaveCSS('opacity', '0');
    }

    await second.hover();
    await expect(phrase(second)).toHaveCSS('opacity', '1');
    await expect(phrase(first)).toHaveCSS('opacity', '0');
    // Os outros continuam inteiros, sem esmaecer.
    await expect(first.locator('.persona-figure')).toHaveCSS('opacity', '1');
    // E nada aparece abaixo do personagem.
    await expect(page.locator('.persona-actions:visible')).toHaveCount(0);
  });

  test('teclado: Tab mostra a frase, setas andam, Enter escolhe e "Entrar" abre', async ({
    page,
  }) => {
    await openHome(page);
    // O primeiro Tab cai no seletor de tema, que vem antes na tela e no documento.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Tema escuro' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(personas(page).nth(0)).toBeFocused();
    await expect(phrase(personas(page).nth(0))).toHaveCSS('opacity', '1');

    await page.keyboard.press('ArrowRight');
    await expect(personas(page).nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(personas(page).nth(3)).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expectSelected(page, 1);
    await expect(enter(page)).toBeFocused();
    // O leitor de tela ouve a frase e a tecnologia junto do "Entrar".
    await expect(enter(page)).toHaveAccessibleDescription('Quero ver o código Feito em Angular');

    await page.keyboard.press('Tab');
    await expect(back(page)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tecnico\/$/);
  });

  test('teclado: Espaço escolhe; Esc e "Voltar" desfazem e devolvem o foco', async ({ page }) => {
    await openHome(page);
    const client = personas(page).nth(2);

    await client.focus();
    await page.keyboard.press('Space');
    await expectSelected(page, 2);

    await page.keyboard.press('Escape');
    await expectNoneSelected(page);
    await expect(client).toBeFocused();

    await page.keyboard.press('Space');
    await expectSelected(page, 2);
    await page.keyboard.press('Tab');
    await expect(back(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expectNoneSelected(page);
    await expect(client).toBeFocused();
  });

  test('clique escolhe na própria tela; clicar de novo desfaz', async ({ page }) => {
    await openHome(page);
    const recruiter = personas(page).nth(0);

    await recruiter.click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expectSelected(page, 0);
    await expect(phrase(recruiter)).toHaveCSS('opacity', '1');

    await recruiter.click();
    await expectNoneSelected(page);

    await personas(page).nth(3).click();
    await expectSelected(page, 3);
    await enter(page).click();
    await expect(page).toHaveURL(/\/comunidade\/$/);
  });

  test('duplo clique escolhe uma vez só', async ({ page }) => {
    await openHome(page);
    await personas(page).nth(0).dblclick();
    await expectSelected(page, 0);
  });

  test('clicar fora desfaz; tema, pausa e "Voltar" são os únicos outros caminhos', async ({
    page,
  }) => {
    await openHome(page);
    await personas(page).nth(1).click();
    await expectSelected(page, 1);

    // Controles da página não desfazem a escolha.
    await page.getByRole('button', { name: 'Tema escuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByText('Pausar animação').click();
    await expect(page.getByRole('checkbox', { name: 'Pausar animação' })).toBeChecked();
    await expectSelected(page, 1);

    await page.locator('h1').click();
    await expectNoneSelected(page);

    await personas(page).nth(1).click();
    await back(page).click();
    await expectNoneSelected(page);
  });

  test('Ctrl+clique abre a área em outra aba, como um link', async ({ page, context }) => {
    await openHome(page);
    const [tab] = await Promise.all([
      context.waitForEvent('page'),
      personas(page)
        .nth(2)
        .click({ modifiers: ['ControlOrMeta'] }),
    ]);
    await expect(tab).toHaveURL(/\/clientes\/$/);
    await expectNoneSelected(page);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`com um personagem escolhido passa na verificação de acessibilidade (${colorScheme})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme,
      });
      const page = await context.newPage();
      await openHome(page);
      await personas(page).nth(2).click();
      await expectSelected(page, 2);
      await expectAccessible(page);
      await context.close();
    });
  }

  test('tema escuro passa na verificação de acessibilidade', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await openHome(page);
    await personas(page).nth(2).focus();
    await expectAccessible(page);
    await context.close();
  });

  test('movimento reduzido desliga a transição e a entrada do escolhido', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await openHome(page);
    await expect(page.locator('.persona-figure').first()).toHaveCSS('transition-duration', '0s');
    await expect(page.locator('.persona-phrase').first()).toHaveCSS('transition-duration', '0s');
    await personas(page).nth(0).click();
    await expect(items(page).nth(0)).toHaveCSS('animation-name', 'none');
    await context.close();
  });

  test('sem JavaScript, o personagem continua sendo um link e o painel não aparece', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.persona-actions:visible')).toHaveCount(0);
    await expect(personas(page).nth(2)).not.toHaveAttribute('role');
    await personas(page).nth(2).click();
    await expect(page).toHaveURL(/\/clientes\/$/);
    await context.close();
  });

  test('liga para "Como foi feito"', async ({ page }) => {
    await openHome(page);
    await page.getByRole('link', { name: 'Como foi feito' }).click();
    await expect(page).toHaveURL(/\/como-foi-feito\/$/);
  });

  test('"Como foi feito" continua à mão com um personagem escolhido', async ({ page }) => {
    await openHome(page);
    await personas(page).nth(0).click();
    await expectSelected(page, 0);
    await page.getByRole('link', { name: 'Como foi feito' }).click();
    await expect(page).toHaveURL(/\/como-foi-feito\/$/);
  });
});

test.describe('home em tela larga com toque', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

  test('tocar escolhe o personagem; "Entrar" abre a área', async ({ page }) => {
    await openHome(page);

    await personas(page).nth(0).tap();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expectSelected(page, 0);

    await back(page).tap();
    await expectNoneSelected(page);

    await personas(page).nth(2).tap();
    await expectSelected(page, 2);
    await enter(page).tap();
    await expect(page).toHaveURL(/\/clientes\/$/);
  });
});

test.describe('home no celular (carrossel)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('mostra um personagem por vez, com a frase visível', async ({ page }) => {
    await openHome(page);
    const [first, second] = [personas(page).nth(0), personas(page).nth(1)];

    await expect(phrase(first)).toHaveCSS('opacity', '1');
    await expect(first).toBeInViewport({ ratio: 0.9 });
    await expect(second).not.toBeInViewport({ ratio: 0.5 });

    // A página não rola de lado; só a lista de personagens.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await expectAccessible(page);
  });

  test('desliza até o próximo, toca para escolher e volta ao mesmo lugar', async ({ page }) => {
    await openHome(page);
    const list = page.locator('ul.personas');
    const second = personas(page).nth(1);
    const figure = second.locator('.persona-figure');

    await second.scrollIntoViewIfNeeded();
    await expect(second).toBeInViewport({ ratio: 0.9 });
    // O pontinho do personagem à vista acompanha o deslize.
    await expect(list).toHaveAttribute('data-slide', '1');
    const atRest = await figure.boundingBox();

    await second.tap();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expectSelected(page, 1);
    // O personagem não muda de lugar nem de tamanho, e os pontinhos somem.
    expect(await figure.boundingBox()).toEqual(atRest);
    await expect(page.locator('.persona-dots')).toBeHidden();
    await expectAccessible(page);

    await back(page).tap();
    await expectNoneSelected(page);
    await expect(list).toHaveAttribute('data-slide', '1');
    await expect(second).toBeInViewport({ ratio: 0.9 });
    expect(await figure.boundingBox()).toEqual(atRest);

    await second.tap();
    await enter(page).tap();
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
 * dele. O axe não mede texto sobre degradê, galho, pétala ou a arte do
 * personagem; este teste mede. O texto fica transparente, a tela é capturada
 * e lida em um canvas.
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

  // As figuras ficam: a frase do personagem é lida sobre a arte dele.
  await page.addStyleTag({
    content:
      '.home, .home * { color: transparent !important; text-decoration-color: transparent !important; }' +
      '.home ds-badge, .persona-enter, .home-motion input { visibility: hidden !important; }',
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

const textBlocks = ['.home h1', '.persona .persona-phrase', '.home-more a', '.home-motion'];
const selectedBlocks = [
  '.home h1',
  'li[data-selected] .persona-phrase',
  'li[data-selected] .persona-back',
  '.home-more a',
  '.home-motion',
];

/** Espera as figuras carregarem: o contraste da frase depende da arte atrás dela. */
async function figuresLoaded(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page
        .locator('img.persona-figure')
        .first()
        .evaluate((image) => (image as HTMLImageElement).naturalWidth > 0),
    )
    .toBe(true);
}

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
    test(`o texto tem contraste AA sobre o cenário e a figura (${colorScheme})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme,
      });
      const page = await context.newPage();
      await openHome(page);
      await figuresLoaded(page);
      await page.getByRole('checkbox').check();
      // Com foco de teclado, a frase do primeiro personagem fica visível.
      await page.getByRole('button', { name: 'Tema escuro' }).focus();
      await page.keyboard.press('Tab');
      await expect(personas(page).first()).toBeFocused();
      await expect(phrase(personas(page).first())).toHaveCSS('opacity', '1');

      const contrasts = await worstContrast(page, textBlocks);
      for (const [block, value] of Object.entries(contrasts)) {
        expect(value, `${block} em ${colorScheme}`).toBeGreaterThanOrEqual(4.5);
      }
      await context.close();
    });

    test(`com um personagem escolhido o texto tem contraste AA (${colorScheme})`, async ({
      browser,
    }) => {
      // Sem a animação de entrada, a captura não pega o personagem pela metade.
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await openHome(page);
      await figuresLoaded(page);
      await personas(page).first().click();
      await expectSelected(page, 0);

      const contrasts = await worstContrast(page, selectedBlocks);
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
    test(`o texto tem contraste AA sobre o cenário e a figura (${colorScheme})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        colorScheme,
      });
      const page = await context.newPage();
      await openHome(page);
      await figuresLoaded(page);
      await page.getByRole('checkbox').check();

      const contrasts = await worstContrast(page, textBlocks);
      for (const [block, value] of Object.entries(contrasts)) {
        expect(value, `${block} em ${colorScheme}`).toBeGreaterThanOrEqual(4.5);
      }

      // Escolhido: a frase continua sobre a figura e o "Voltar" aparece.
      await openHome(page);
      await figuresLoaded(page);
      await personas(page).first().tap();
      await expectSelected(page, 0);
      const selected = await worstContrast(page, selectedBlocks);
      for (const [block, value] of Object.entries(selected)) {
        expect(value, `${block} escolhido em ${colorScheme}`).toBeGreaterThanOrEqual(4.5);
      }
      await context.close();
    });
  }
});

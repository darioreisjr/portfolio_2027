import { expect, test, type Page } from '@playwright/test';

const toggle = (page: Page) => page.getByRole('button', { name: 'Tema escuro' });

/** Nome e estado da animação de um elemento ou de um pseudo-elemento dele. */
const motion = (page: Page, selector: string, pseudo?: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element, which) => {
      const style = getComputedStyle(element, which);
      return { name: style.animationName, state: style.animationPlayState };
    }, pseudo);

const moving: [string, string, string?][] = [
  ['.sakura-branch', 'sakura-gust'],
  ['.sakura-flower', 'sakura-flutter'],
  ['.sakura-cloud', 'sakura-cross'],
  ['.sakura-sky', 'sakura-drift'],
  ['.sakura-orb', 'sakura-breathe', '::before'],
  ['.sakura-petal', 'sakura-fall'],
];

test.describe('a tela cabe na janela, sem rolagem', () => {
  const windows = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 800 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ];

  for (const viewport of windows) {
    for (const path of ['/', '/es/']) {
      test(`${path} em ${viewport.width}x${viewport.height}`, async ({ browser }) => {
        // Sem movimento: mede o layout, não um quadro da entrada.
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(path);

        const fit = await page.evaluate(() => ({
          page: document.documentElement.scrollHeight,
          window: innerHeight,
          lastControl: document.querySelector('.ds-dock')?.getBoundingClientRect().bottom ?? 0,
          figure: document.querySelector('.persona-figure')?.getBoundingClientRect().height ?? 0,
        }));

        expect(fit.page, 'a página não rola').toBeLessThanOrEqual(fit.window);
        expect(fit.lastControl, 'o último controle está à vista').toBeLessThanOrEqual(fit.window);
        // Encolhe para caber, mas continua reconhecível.
        expect(fit.figure).toBeGreaterThanOrEqual(110);
        await context.close();
      });
    }

    test(`com um personagem escolhido em ${viewport.width}x${viewport.height}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/es/');
      const figure = page.locator('.persona-figure').first();
      const atRest = (await figure.boundingBox())?.height ?? 0;

      await page.getByRole('button', { name: 'Estoy contratando' }).click();
      await expect(page.getByRole('button', { name: 'Volver' })).toBeVisible();

      const fit = await page.evaluate(() => ({
        page: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        window: innerHeight,
        windowWidth: innerWidth,
        lastControl: document.querySelector('.ds-dock')?.getBoundingClientRect().bottom ?? 0,
        back:
          document.querySelector('li[data-selected] .persona-back')?.getBoundingClientRect()
            .bottom ?? 0,
      }));
      expect(fit.page, 'a página não rola').toBeLessThanOrEqual(fit.window);
      expect(fit.pageWidth, 'a página não rola de lado').toBeLessThanOrEqual(fit.windowWidth);
      expect(fit.lastControl, 'o último controle está à vista').toBeLessThanOrEqual(fit.window);
      expect(fit.back, '"Voltar" está à vista').toBeLessThanOrEqual(fit.window);

      // Sozinho no palco o personagem não encolhe; no carrossel fica igual.
      const selected = (await figure.boundingBox())?.height ?? 0;
      expect(selected).toBeGreaterThanOrEqual(Math.floor(atRest));
      // Com a descrição no painel, a figura ainda fica de bom tamanho.
      expect(selected).toBeGreaterThanOrEqual(200);
      await context.close();
    });
  }

  test('em janela muito baixa a rolagem volta e o personagem mantém o tamanho', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
    const page = await context.newPage();
    await page.goto('/');

    const figure = await page.locator('.persona-figure').first().boundingBox();
    expect(figure?.height).toBeGreaterThanOrEqual(170);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(390);
    await context.close();
  });
});

test.describe('movimento do cenário', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  test('galhos, flores, névoa, astro e pétalas se movem', async ({ page }) => {
    await page.goto('/');
    for (const [selector, name, pseudo] of moving) {
      expect(await motion(page, selector, pseudo), selector).toEqual({ name, state: 'running' });
    }
  });

  test('cada flor do galho tem o próprio atraso', async ({ page }) => {
    await page.goto('/');
    const delays = await page
      .locator('.sakura-bough-left .sakura-flower')
      .evaluateAll((flowers) => flowers.map((flower) => getComputedStyle(flower).animationDelay));
    expect(delays.length).toBeGreaterThan(10);
    expect(new Set(delays).size).toBe(delays.length);
  });

  test('"Pausar animação" para tudo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Pausar animação' }).check();
    for (const [selector, , pseudo] of moving) {
      expect((await motion(page, selector, pseudo)).state, selector).toBe('paused');
    }
  });

  test('com movimento reduzido nada se mexe', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/');
    for (const [selector, , pseudo] of moving) {
      expect((await motion(page, selector, pseudo)).name, selector).toBe('none');
    }
    await context.close();
  });

  test('há três faixas de névoa em tela larga e duas no celular', async ({ browser, page }) => {
    await page.goto('/');
    await expect(page.locator('.sakura-cloud:visible')).toHaveCount(3);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const phone = await context.newPage();
    await phone.goto('/');
    await expect(phone.locator('.sakura-cloud:visible')).toHaveCount(2);
    await context.close();
  });
});

test.describe('movimento do personagem escolhido', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  // Contínuas do escolhido: respirar (figura), pulsar (brilho) e balançar (seta).
  const idle = async (page: Page) => ({
    breathe: await motion(page, 'li[data-selected] .persona-figure'),
    glow: await page.locator('li[data-selected] > .persona').evaluate((persona) => {
      const style = getComputedStyle(persona, '::before');
      return { name: style.animationName, state: style.animationPlayState };
    }),
    arrow: await motion(page, 'li[data-selected] .persona-enter', '::after'),
  });

  async function choose(page: Page): Promise<void> {
    await page.goto('/');
    await page.getByRole('button', { name: 'Estou contratando' }).click();
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeFocused();
  }

  test('respira, o brilho pulsa e a seta balança na opção em foco', async ({ page }) => {
    await choose(page);
    expect(await idle(page)).toEqual({
      breathe: { name: 'persona-breathe', state: 'running' },
      glow: { name: 'persona-flash, persona-glow', state: 'running, running' },
      arrow: { name: 'persona-arrow', state: 'running' },
    });
  });

  test('"Pausar animação" para as três, mas deixa o clarão da escolha terminar', async ({
    page,
  }) => {
    await choose(page);
    await page.getByRole('checkbox', { name: 'Pausar animação' }).check();
    // O foco foi para a caixa de pausa; a seta volta com o ponteiro no "Entrar".
    await page.getByRole('link', { name: 'Entrar' }).hover();
    expect(await idle(page)).toEqual({
      breathe: { name: 'persona-breathe', state: 'paused' },
      glow: { name: 'persona-flash, persona-glow', state: 'running, paused' },
      arrow: { name: 'persona-arrow', state: 'paused' },
    });
  });

  test('com movimento reduzido não existem', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await choose(page);
    expect(await idle(page)).toEqual({
      breathe: { name: 'none', state: 'running' },
      glow: { name: 'none', state: 'running' },
      arrow: { name: 'none', state: 'running' },
    });
    await context.close();
  });

  test('no celular o escolhido não respira: a figura não muda de tamanho', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('a.persona').first()).toHaveAttribute('role', 'button');
    await page.locator('a.persona').first().tap();
    await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible();
    expect((await motion(page, 'li[data-selected] .persona-figure')).name).toBe('none');
    await context.close();
  });
});

test.describe('entrada da tela', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  test('o título desce e os personagens entram um depois do outro, só com deslocamento', async ({
    page,
  }) => {
    await page.goto('/');
    expect((await motion(page, '.home h1')).name).toBe('home-title');
    const entries = await page.locator('ul.personas > li').evaluateAll((items) =>
      items.map((item) => {
        const style = getComputedStyle(item);
        return { name: style.animationName, delay: style.animationDelay };
      }),
    );
    expect(entries.map((entry) => entry.name)).toEqual(Array(4).fill('persona-enter'));
    // Cada um começa depois do anterior; o primeiro, sem atraso.
    expect(entries.map((entry) => entry.delay)).toEqual(['0s', '0.09s', '0.18s', '0.27s']);

    // A imagem do primeiro personagem é o LCP: nunca fica transparente.
    await expect(page.locator('img.persona-figure').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('ul.personas > li').first()).toHaveCSS('opacity', '1');
  });

  test('no celular os personagens não têm entrada', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('ul.personas > li').first()).toHaveCSS('animation-name', 'none');
    await context.close();
  });
});

test.describe('sol e lua', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  const opacity = (page: Page, selector: string) =>
    page.locator(selector).evaluate((orb) => Number(getComputedStyle(orb).opacity));
  const offset = (page: Page, selector: string) =>
    page.locator(selector).evaluate((orb) => orb.getBoundingClientRect().top);

  test('de dia o sol está no céu; ao trocar o tema ele se põe e a lua nasce', async ({ page }) => {
    await page.goto('/');
    expect(await opacity(page, '.sakura-sun')).toBeGreaterThan(0.5);
    expect(await opacity(page, '.sakura-moon')).toBe(0);
    const sunAtNoon = await offset(page, '.sakura-sun');
    const moonBelow = await offset(page, '.sakura-moon');
    expect(moonBelow).toBeGreaterThan(sunAtNoon);

    await toggle(page).click();
    await expect.poll(() => opacity(page, '.sakura-moon')).toBeGreaterThan(0.5);
    await expect.poll(() => opacity(page, '.sakura-sun')).toBe(0);
    // A lua subiu para onde o sol estava, e o sol desceu.
    expect(await offset(page, '.sakura-moon')).toBeLessThan(moonBelow);
    expect(await offset(page, '.sakura-sun')).toBeGreaterThan(sunAtNoon);

    await toggle(page).click();
    await expect.poll(() => opacity(page, '.sakura-sun')).toBeGreaterThan(0.5);
  });

  test('a troca leva cerca de um segundo, e é imediata com movimento reduzido', async ({
    browser,
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('.home')).toHaveCSS('transition-duration', /1s$/);

    const context = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'light' });
    const still = await context.newPage();
    await still.goto('/');
    await toggle(still).click();
    expect(await opacity(still, '.sakura-sun')).toBe(0);
    await context.close();
  });
});

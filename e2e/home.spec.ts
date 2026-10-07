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

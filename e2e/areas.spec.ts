import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { settled } from './support/motion';

// As quatro páginas internas que ainda mostram a tela "em construção" (ADR 0009). Nas duas do
// shell a mensagem é do MFE, em shadow DOM; nas duas do Next.js, do próprio
// documento. Os localizadores do Playwright atravessam o shadow DOM.
// O recrutador já tem página de conteúdo e é testado em recruiter.spec.ts.
const areas = [
  {
    area: 'tech',
    path: '/tecnico/',
    title: 'Técnico',
    mfe: 'mfe-tecnico',
    figure: 'tech',
    color: { light: 'rgb(188, 0, 45)', dark: 'rgb(255, 128, 135)' },
    scene: 'area-glow',
  },
  {
    area: 'client',
    path: '/clientes/',
    title: 'Clientes',
    mfe: 'mfe-clientes',
    figure: 'client',
    color: { light: 'rgb(10, 111, 148)', dark: 'rgb(97, 218, 251)' },
    scene: 'area-tide',
  },
  {
    area: 'community',
    path: '/comunidade/',
    title: 'Comunidade',
    mfe: undefined,
    figure: 'community',
    color: { light: 'rgb(12, 14, 19)', dark: 'rgb(255, 255, 255)' },
    scene: 'area-glow',
  },
  {
    area: 'how-it-was-built',
    path: '/como-foi-feito/',
    title: 'Como foi feito',
    mfe: undefined,
    // "Como foi feito" não tem personagem próprio.
    figure: undefined,
    color: { light: 'rgb(12, 14, 19)', dark: 'rgb(255, 255, 255)' },
    scene: 'area-glow',
  },
] as const;

const message = (page: Page) => page.getByRole('heading', { level: 2 });
/** O preenchimento da barra: parte do MFE ou elemento do documento. */
const barFill = (page: Page): Locator => page.locator('[part="bar-fill"], .area-bar-fill');
const pause = (page: Page) => page.getByRole('checkbox', { name: 'Pausar animação' });

function failOnBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (entry) => {
    if (entry.type() === 'error') errors.push(entry.text());
  });
  return errors;
}

test.use({ viewport: { width: 1280, height: 800 } });

for (const colorScheme of ['light', 'dark'] as const) {
  for (const { area, path, title, mfe, figure, color } of areas) {
    test(`${path} mostra a fase em construção na cor da área (${colorScheme})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme,
      });
      const page = await context.newPage();
      const errors = failOnBrowserErrors(page);
      await page.goto(path);

      const stage = page.locator('main.area-stage');
      await expect(stage).toHaveAttribute('data-area', area);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      // Nas áreas do shell quem escreve a mensagem é o MFE, depois de montar.
      if (mfe) {
        await expect(stage).toHaveAttribute('data-ready', area);
        await expect(page.locator(`.area-outlet > ${mfe}`)).toHaveAttribute('locale', 'pt-BR');
      }
      await expect(message(page)).toHaveText('Fase em construção');
      await expect(
        page.getByText('Esta área ainda está sendo forjada. Volte em breve.'),
      ).toBeVisible();

      // A cor da área está no título da mensagem, na etiqueta e no botão.
      await expect(message(page)).toHaveCSS('color', color[colorScheme]);
      await expect(page.locator('.area-title')).toHaveCSS('background-color', color[colorScheme]);
      await expect(page.getByRole('link', { name: 'Voltar à escolha de perfil' })).toHaveAttribute(
        'href',
        '/',
      );

      // O personagem da área vem no HTML, com as dimensões do arquivo.
      const avatar = page.locator('img.area-figure');
      if (figure) {
        await expect(avatar).toHaveAttribute('src', `/_home/personas/${figure}.webp`);
        await expect(avatar).toHaveAttribute('height', '640');
        await expect
          .poll(() => avatar.evaluate((image) => (image as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
      } else {
        await expect(avatar).toHaveCount(0);
      }

      // O cenário é enfeite: fora da árvore de acessibilidade, do foco e dos cliques.
      const scene = page.locator('.area-scene');
      await expect(scene).toHaveAttribute('aria-hidden', 'true');
      await expect(scene).toHaveCSS('pointer-events', 'none');
      await expect(scene.locator('a, button, input, [tabindex]')).toHaveCount(0);

      await settled(page);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
      expect(errors).toEqual([]);
      await context.close();
    });
  }
}

test('a mensagem e o botão acompanham o idioma, no MFE e nas páginas Next.js', async ({ page }) => {
  const cases = [
    ['/en/clients/', 'Stage under construction', 'Back to profile selection', '/en/'],
    ['/es/tecnico/', 'Fase en construcción', 'Volver a la elección de perfil', '/es/'],
    ['/es/comunidad/', 'Fase en construcción', 'Volver a la elección de perfil', '/es/'],
    ['/en/how-it-was-built/', 'Stage under construction', 'Back to profile selection', '/en/'],
  ] as const;
  for (const [path, title, back, home] of cases) {
    await page.goto(path);
    await expect(message(page), path).toHaveText(title);
    await expect(page.getByRole('link', { name: back }), path).toHaveAttribute('href', home);
  }
});

test('o botão de volta leva à tela de escolha de perfil', async ({ page }) => {
  await page.goto('/es/clientes/');
  await page.getByRole('link', { name: 'Volver a la elección de perfil' }).click();
  await expect(page).toHaveURL(/\/es\/$/);
  await expect(page.locator('h1')).toHaveText('Elige tu camino');
});

for (const { path, scene } of areas) {
  test(`${path} tem cenário e barra em movimento, e a pausa para os dois`, async ({ page }) => {
    await page.goto(path);
    await expect(message(page)).toBeVisible();

    // A barra anda mesmo quando é parte de um MFE: a animação é aplicada de fora.
    await expect(barFill(page)).toHaveCSS('animation-name', 'area-bar');
    await expect(barFill(page)).toHaveCSS('animation-play-state', 'running');
    const sceneLayer = page.locator('.area-scene-back');
    await expect(sceneLayer).toHaveCSS('animation-name', scene);
    await expect(sceneLayer).toHaveCSS('animation-play-state', 'running');

    await pause(page).check();
    await expect(barFill(page)).toHaveCSS('animation-play-state', 'paused');
    const states = await page.locator('.area-scene *').evaluateAll((nodes) =>
      nodes
        .map((node) => getComputedStyle(node))
        .filter((style) => style.animationName !== 'none')
        .map((style) => style.animationPlayState),
    );
    expect(states.length).toBeGreaterThan(0);
    expect(new Set(states)).toEqual(new Set(['paused']));
  });
}

test('com movimento reduzido nada se mexe e não há botão de pausa', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const { path } of areas) {
    await page.goto(path);
    await expect(message(page), path).toBeVisible();
    await expect(barFill(page), path).toHaveCSS('animation-name', 'none');
    const moving = await page
      .locator('.area-scene *, .area-message')
      .evaluateAll(
        (nodes) => nodes.filter((node) => getComputedStyle(node).animationName !== 'none').length,
      );
    expect(moving, path).toBe(0);
    await expect(page.getByRole('checkbox'), path).toHaveCount(0);
  }
  await context.close();
});

test('a pausa fica no grupo do canto, antes da bandeira, e funciona pelo teclado', async ({
  page,
}) => {
  await page.goto('/tecnico/');
  const [pauseBox, flagBox] = [
    await pause(page).boundingBox(),
    await page.locator('.ds-language-switcher summary').boundingBox(),
  ];
  expect(pauseBox?.y).toBe(flagBox?.y);
  expect((pauseBox?.x ?? 0) + (pauseBox?.width ?? 0)).toBeLessThanOrEqual(flagBox?.x ?? 0);

  await pause(page).focus();
  await page.keyboard.press('Space');
  await expect(pause(page)).toBeChecked();
  await expect(barFill(page)).toHaveCSS('animation-play-state', 'paused');
  await page.keyboard.press('Space');
  await expect(barFill(page)).toHaveCSS('animation-play-state', 'running');
});

test('a home não carrega a folha das páginas internas', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(requested.filter((path) => path.includes('areas.css'))).toEqual([]);
  // E as páginas internas carregam, das duas origens de documento.
  for (const path of ['/recrutador/', '/comunidade/']) {
    requested.length = 0;
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(requested, path).toContain('/_ds/areas.css');
  }
});

test.describe('no celular', () => {
  for (const { path } of areas) {
    test(`${path} cabe na largura e o grupo do canto não cobre o botão de volta`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 360, height: 740 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(path);
      await expect(message(page)).toBeVisible();

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        360,
      );
      // No fim da página, o botão de volta fica acima do grupo fixo do canto.
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const [back, dock] = [
        await page.locator('.area-back').boundingBox(),
        await page.locator('.ds-dock').boundingBox(),
      ];
      expect((back?.y ?? 0) + (back?.height ?? 0)).toBeLessThanOrEqual(dock?.y ?? 0);
      await context.close();
    });
  }
});

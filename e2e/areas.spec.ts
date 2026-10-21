import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { settled } from './support/motion';

// Testes das páginas internas (ADR 0009). Todas as cinco áreas
// (recrutador, técnico, clientes, comunidade e como foi feito) já têm páginas
// de conteúdo próprias e são testadas em recruiter.spec.ts, tech.spec.ts,
// client.spec.ts, community.spec.ts e how-it-was-built.spec.ts.
// Este arquivo preserva os testes do palco compartilhado das páginas internas
// do shell (carregamento de areas.css, CLS e controle do dock).
const areas: readonly {
  area: string;
  path: string;
  title: string;
  mfe?: string;
  figure?: string;
  color: { light: string; dark: string };
  scene: string;
}[] = [];

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
  await page.goto('/recrutador/');
  const [pauseBox, flagBox] = [
    await pause(page).boundingBox(),
    await page.locator('.ds-language-switcher summary').boundingBox(),
  ];
  expect(pauseBox?.y).toBe(flagBox?.y);
  expect((pauseBox?.x ?? 0) + (pauseBox?.width ?? 0)).toBeLessThanOrEqual(flagBox?.x ?? 0);

  await pause(page).focus();
  await page.keyboard.press('Space');
  await expect(pause(page)).toBeChecked();
  await expect(page.locator('.area-scene-back')).toHaveCSS('animation-play-state', 'paused');
  await page.keyboard.press('Space');
  await expect(page.locator('.area-scene-back')).toHaveCSS('animation-play-state', 'running');
});

test('a home não carrega a folha das páginas internas', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(requested.filter((path) => path.includes('areas.css'))).toEqual([]);
  // E as páginas internas carregam, das duas origens de documento.
  for (const path of ['/recrutador/', '/tecnico/', '/clientes/']) {
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

test('CLS das três áreas de microfrontend fica abaixo de 0,1 (issue #39)', async ({ page }) => {
  for (const path of ['/recrutador/', '/tecnico/', '/clientes/']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as { hadRecentInput?: boolean }).hadRecentInput) {
              clsValue += (entry as { value: number }).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 500);
      });
    });
    expect(cls).toBeLessThan(0.1);
  }
});

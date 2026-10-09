import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Uma linha por área, um caminho por idioma. Escrito à mão de propósito: o teste
// confere o site publicado contra a tabela de docs/architecture/mfe-map.md.
const locales = ['pt-BR', 'en', 'es'] as const;
const names = ['Português (Brasil)', 'English', 'Español'];
const areas = [
  { area: 'home', paths: ['/', '/en/', '/es/'] },
  {
    area: 'recruiter',
    paths: ['/recrutador/', '/en/recruiter/', '/es/reclutador/'],
  },
  { area: 'tech', paths: ['/tecnico/', '/en/tech/', '/es/tecnico/'] },
  { area: 'client', paths: ['/clientes/', '/en/clients/', '/es/clientes/'] },
  {
    area: 'community',
    paths: ['/comunidade/', '/en/community/', '/es/comunidad/'],
  },
  {
    area: 'how-it-was-built',
    paths: ['/como-foi-feito/', '/en/how-it-was-built/', '/es/como-se-hizo/'],
  },
];

const switcher = (page: Page) => page.locator('.ds-dock details.ds-language-switcher');
/** A bandeira do idioma em uso: abre e fecha a lista. */
const current = (page: Page) => switcher(page).locator('summary');
/** As bandeiras dos outros dois idiomas. */
const flags = (page: Page) => switcher(page).locator('a');

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

for (const { area, paths } of areas) {
  test(`${area}: a bandeira do idioma em uso abre os outros dois, para a mesma área`, async ({
    page,
  }) => {
    for (const [index, path] of paths.entries()) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', locales[index] ?? '');

      // Fechado: só o idioma da página, pelo nome.
      await expect(current(page).getByRole('img')).toHaveAccessibleName(names[index] ?? '');
      await expect(flags(page)).toHaveCount(2);
      for (const flag of await flags(page).all()) await expect(flag).toBeHidden();
      // O idioma em uso não é link nem leva marca de página atual.
      await expect(switcher(page).locator('[aria-current]')).toHaveCount(0);

      await current(page).click();
      const others = paths
        .map((href, target) => ({ href, target }))
        .filter((o) => o.target !== index);
      for (const [position, { href, target }] of others.entries()) {
        const flag = flags(page).nth(position);
        await expect(flag).toBeVisible();
        await expect(flag).toHaveAttribute('href', href);
        await expect(flag).toHaveAttribute('hreflang', locales[target] ?? '');
        await expect(flag).toHaveAttribute('lang', locales[target] ?? '');
        await expect(flag).toHaveAccessibleName(names[target] ?? '');
      }
    }
  });
}

test('abrir e escolher uma bandeira troca o idioma da página e da área', async ({ page }) => {
  await page.goto('/');
  await current(page).click();
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Choose your path');
  // A página nova abre com a lista fechada e a bandeira dela.
  await expect(current(page).getByRole('img')).toHaveAccessibleName('English');
  await expect(flags(page).first()).toBeHidden();

  // Nas áreas do shell também, e o MFE renderiza no idioma novo.
  await page.goto('/recrutador/');
  await current(page).click();
  await page.getByRole('link', { name: 'Español' }).click();
  await expect(page).toHaveURL(/\/es\/reclutador\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('mfe-recrutador')).toContainText('Fase en construcción');
});

test('clicar de novo na bandeira fecha a lista', async ({ page }) => {
  await page.goto('/');
  await current(page).click();
  await expect(flags(page).first()).toBeVisible();
  await current(page).click();
  await expect(flags(page).first()).toBeHidden();
});

test('fica no canto inferior direito, e a lista abre em coluna para cima', async ({ page }) => {
  for (const path of ['/', '/tecnico/', '/comunidade/']) {
    await page.goto(path);
    const dock = await page.locator('.ds-dock').boundingBox();
    if (!dock) throw new Error('sem grupo do canto');
    expect(1280 - (dock.x + dock.width), path).toBeLessThanOrEqual(16);
    expect(800 - (dock.y + dock.height), path).toBeLessThanOrEqual(16);

    await current(page).click();
    const anchor = await current(page).boundingBox();
    if (!anchor) throw new Error('sem bandeira do idioma em uso');
    const tops: number[] = [];
    for (const flag of await flags(page).all()) {
      const box = await flag.boundingBox();
      if (!box) throw new Error('bandeira sem caixa');
      // Acima da bandeira em uso, alinhada à direita com ela.
      expect(box.y + box.height, path).toBeLessThanOrEqual(anchor.y);
      expect(box.x, path).toBe(anchor.x);
      tops.push(box.y);
    }
    expect(new Set(tops).size, path).toBe(2);
    // Abrir não muda o tamanho do grupo do canto.
    expect((await page.locator('.ds-dock').boundingBox())?.width, path).toBe(dock.width);

    await expect
      .poll(() =>
        switcher(page)
          .locator('img')
          .evaluateAll((images) =>
            images.map((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      )
      .toEqual([true, true, true]);
  }
});

test('a bandeira dá um pulo sob o mouse, sem mexer na área de clique', async ({ page }) => {
  await page.goto('/tecnico/');
  const before = await current(page).boundingBox();
  await current(page).hover();
  await expect(current(page).locator('img')).toHaveCSS('animation-name', 'ds-hop');
  expect(await current(page).boundingBox()).toEqual(before);
});

test('fechada, a lista não baixa as outras bandeiras', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith('/_ds/flags/')) requested.push(pathname);
  });
  await page.goto('/es/');
  await expect(current(page).getByRole('img')).toHaveAccessibleName('Español');
  await page.waitForLoadState('networkidle');
  expect(requested).toEqual(['/_ds/flags/es.svg']);
});

test('pelo teclado: abre com Enter, e o grupo é o último na ordem do Tab', async ({ page }) => {
  await page.goto('/comunidade/');
  const lastFocusable = () =>
    page.evaluate(() => {
      const visible = [
        ...document.querySelectorAll<HTMLElement>('a[href], button, input, summary, [tabindex]'),
      ].filter((element) => element.checkVisibility());
      return visible.at(-1) === document.activeElement;
    });

  await current(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(current(page)).toBeFocused();
  await expect(current(page)).not.toHaveCSS('outline-style', 'none');
  // Fechada, a bandeira em uso é o último controle da página.
  expect(await lastFocusable()).toBe(true);

  await page.keyboard.press('Enter');
  await expect(flags(page).first()).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(flags(page).last()).toBeFocused();
  await expect(flags(page).last()).not.toHaveCSS('outline-style', 'none');
  expect(await lastFocusable()).toBe(true);

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/es\/comunidad\/$/);
});

test('funciona sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/');
  await expect(flags(page).first()).toBeHidden();
  await current(page).click();
  await page.getByRole('link', { name: 'Español' }).click();
  await expect(page).toHaveURL(/\/es\/$/);

  await page.goto('/clientes/');
  await current(page).click();
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/clients\/$/);
  await context.close();
});

test('o botão de pausa fica junto da bandeira, na home e nas páginas internas', async ({
  page,
}) => {
  // Todas têm cenário animado; o teste das páginas internas está em areas.spec.ts.
  for (const path of ['/', '/comunidade/', '/recrutador/']) {
    await page.goto(path);
    const pause = page.locator('.ds-dock').getByRole('checkbox', { name: 'Pausar animação' });
    await expect(pause, path).toBeVisible();
    const [pauseBox, flagBox] = [await pause.boundingBox(), await current(page).boundingBox()];
    expect(pauseBox?.y, path).toBe(flagBox?.y);
    expect((pauseBox?.x ?? 0) + (pauseBox?.width ?? 0), path).toBeLessThanOrEqual(flagBox?.x ?? 0);
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`o grupo passa na verificação de acessibilidade, fechado e aberto (${colorScheme})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    for (const path of ['/en/', '/es/tecnico/', '/comunidade/']) {
      await page.goto(path);
      for (const state of ['fechado', 'aberto']) {
        const { violations } = await new AxeBuilder({ page }).include('.ds-dock').analyze();
        expect(violations.map((violation) => `${path} ${state} ${violation.id}`)).toEqual([]);
        await current(page).click();
      }
    }
    await context.close();
  });
}

test.describe('no celular', () => {
  for (const width of [390, 360]) {
    test(`o grupo não encosta nos personagens nem no painel em ${width} px`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 740 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto('/es/');
      await expect(page.locator('a.persona').first()).toHaveAttribute('role', 'button');

      const overlaps = () =>
        page.evaluate(() => {
          const dock = document.querySelector('.ds-dock')?.getBoundingClientRect();
          if (!dock) throw new Error('sem grupo de bandeiras');
          const visible = [
            ...document.querySelectorAll(
              '.persona-figure, .persona-phrase, .persona-dots, .persona-actions > *',
            ),
          ].filter((element) => getComputedStyle(element).visibility !== 'hidden');
          return visible
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return (
                box.width > 0 &&
                dock.left < box.right &&
                box.left < dock.right &&
                dock.top < box.bottom &&
                box.top < dock.bottom
              );
            })
            .map((element) => element.className);
        });

      expect(await overlaps()).toEqual([]);
      const dock = await page.locator('.ds-dock').boundingBox();
      expect(dock?.x).toBeGreaterThanOrEqual(0);

      await page.locator('a.persona').first().tap();
      await expect(page.getByRole('button', { name: 'Volver' })).toBeVisible();
      expect(await overlaps()).toEqual([]);

      // Aberta, a coluna flutua por cima do canto: cabe na tela e cada bandeira
      // fica por cima do que estiver atrás dela.
      await current(page).tap();
      for (const flag of await flags(page).all()) {
        const box = await flag.boundingBox();
        if (!box) throw new Error('bandeira sem caixa');
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        const onTop = await flag.evaluate((link) => {
          const { x, y, width: w, height: h } = link.getBoundingClientRect();
          return link.contains(document.elementFromPoint(x + w / 2, y + h / 2));
        });
        expect(onTop).toBe(true);
      }
      await context.close();
    });
  }
});

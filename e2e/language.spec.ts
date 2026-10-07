import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Uma linha por área, um caminho por idioma. Escrito à mão de propósito: o teste
// confere o site publicado contra a tabela de docs/architecture/mfe-map.md.
const locales = ['pt-BR', 'en', 'es', 'pt-PT'] as const;
const names = ['Português (Brasil)', 'English', 'Español', 'Português (Portugal)'];
const areas = [
  { area: 'home', paths: ['/', '/en/', '/es/', '/pt-pt/'] },
  {
    area: 'recruiter',
    paths: ['/recrutador/', '/en/recruiter/', '/es/reclutador/', '/pt-pt/recrutador/'],
  },
  { area: 'tech', paths: ['/tecnico/', '/en/tech/', '/es/tecnico/', '/pt-pt/tecnico/'] },
  { area: 'client', paths: ['/clientes/', '/en/clients/', '/es/clientes/', '/pt-pt/clientes/'] },
  {
    area: 'community',
    paths: ['/comunidade/', '/en/community/', '/es/comunidad/', '/pt-pt/comunidade/'],
  },
  {
    area: 'how-it-was-built',
    paths: [
      '/como-foi-feito/',
      '/en/how-it-was-built/',
      '/es/como-se-hizo/',
      '/pt-pt/como-foi-feito/',
    ],
  },
];

const flags = (page: Page) => page.locator('.ds-dock .ds-language-switcher a');

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

for (const { area, paths } of areas) {
  test(`${area}: as quatro bandeiras levam à mesma área em cada idioma`, async ({ page }) => {
    for (const [index, path] of paths.entries()) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', locales[index] ?? '');

      await expect(flags(page)).toHaveCount(4);
      for (const [target, href] of paths.entries()) {
        const flag = flags(page).nth(target);
        await expect(flag).toHaveAttribute('href', href);
        await expect(flag).toHaveAttribute('hreflang', locales[target] ?? '');
        await expect(flag).toHaveAttribute('lang', locales[target] ?? '');
        await expect(flag).toHaveAccessibleName(names[target] ?? '');
      }
      // Só o idioma da página está marcado.
      await expect(page.locator('.ds-language-switcher a[aria-current="page"]')).toHaveCount(1);
      await expect(flags(page).nth(index)).toHaveAttribute('aria-current', 'page');
    }
  });
}

test('clicar em uma bandeira troca o idioma da página e da área', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Choose your path');

  // Nas áreas do shell também, e o MFE renderiza no idioma novo.
  await page.goto('/recrutador/');
  await page.getByRole('link', { name: 'Español' }).click();
  await expect(page).toHaveURL(/\/es\/reclutador\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('mfe-recrutador')).toContainText('Hola');
});

test('as bandeiras ficam no canto inferior direito e carregam', async ({ page }) => {
  for (const path of ['/', '/tecnico/', '/comunidade/']) {
    await page.goto(path);
    const dock = await page.locator('.ds-dock').boundingBox();
    if (!dock) throw new Error('sem grupo de bandeiras');
    expect(1280 - (dock.x + dock.width), path).toBeLessThanOrEqual(16);
    expect(800 - (dock.y + dock.height), path).toBeLessThanOrEqual(16);

    await flags(page).first().scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator('.ds-language-switcher img')
          .evaluateAll((images) =>
            images.map((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      )
      .toEqual([true, true, true, true]);
  }
});

test('o grupo é o último na ordem do Tab e o foco fica visível', async ({ page }) => {
  await page.goto('/comunidade/');
  await flags(page).last().focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const last = flags(page).last();
  await expect(last).toBeFocused();
  await expect(last).not.toHaveCSS('outline-style', 'none');

  // Depois da última bandeira não há mais nada focável na página.
  const isLast = await last.evaluate((link) => {
    const focusable = [...document.querySelectorAll('a[href], button, input, [tabindex]')];
    return focusable.at(-1) === link;
  });
  expect(isLast).toBe(true);
});

test('funciona sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/');
  await expect(flags(page)).toHaveCount(4);
  await flags(page).nth(2).click();
  await expect(page).toHaveURL(/\/es\/$/);

  await page.goto('/clientes/');
  await flags(page).nth(3).click();
  await expect(page).toHaveURL(/\/pt-pt\/clientes\/$/);
  await context.close();
});

test('só a home tem o botão de pausa, junto das bandeiras', async ({ page }) => {
  await page.goto('/');
  const pause = page.locator('.ds-dock').getByRole('checkbox', { name: 'Pausar animação' });
  await expect(pause).toBeVisible();
  const [pauseBox, flagBox] = [await pause.boundingBox(), await flags(page).first().boundingBox()];
  expect(pauseBox?.y).toBe(flagBox?.y);
  expect((pauseBox?.x ?? 0) + (pauseBox?.width ?? 0)).toBeLessThanOrEqual(flagBox?.x ?? 0);

  for (const path of ['/comunidade/', '/recrutador/']) {
    await page.goto(path);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`o grupo passa na verificação de acessibilidade (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    for (const path of ['/en/', '/es/tecnico/', '/pt-pt/comunidade/']) {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).include('.ds-dock').analyze();
      expect(violations.map((violation) => `${path} ${violation.id}`)).toEqual([]);
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
      // O grupo cabe na largura da tela.
      const dock = await page.locator('.ds-dock').boundingBox();
      expect(dock?.x).toBeGreaterThanOrEqual(0);

      await page.locator('a.persona').first().tap();
      await expect(page.getByRole('button', { name: 'Volver' })).toBeVisible();
      expect(await overlaps()).toEqual([]);
      await context.close();
    });
  }
});

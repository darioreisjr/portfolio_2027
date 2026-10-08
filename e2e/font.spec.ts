import { expect, test, type Page } from '@playwright/test';

const FAMILY = 'M PLUS Rounded 1c';
const routes = ['/', '/comunidade/', '/como-foi-feito/', '/recrutador/', '/tecnico/', '/clientes/'];

/** Arquivos de fonte que a página pediu, pelo caminho. */
function fontRequests(page: Page): string[] {
  const requested: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (/\.(woff2?|ttf|otf)$/.test(pathname)) requested.push(pathname);
  });
  return requested;
}

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

for (const route of routes) {
  test(`${route} usa a fonte do site, servida uma vez de /_ds/fonts/`, async ({ page }) => {
    const requested = fontRequests(page);
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);

    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family.startsWith(`"${FAMILY}"`)).toBe(true);
    // O título é negrito em toda página: o peso 700 tem de ter chegado.
    expect(await page.evaluate((name) => document.fonts.check(`700 16px '${name}'`), FAMILY)).toBe(
      true,
    );

    // No máximo os dois pesos, sempre do endereço compartilhado (budgets.md).
    expect(requested.length).toBeGreaterThan(0);
    expect(new Set(requested).size).toBeLessThanOrEqual(2);
    for (const path of requested) expect(path).toMatch(/^\/_ds\/fonts\/.+\.woff2$/);
  });
}

// O LCP da home está no limite: ela só pode pedir o peso 700, inclusive com o
// painel do personagem aberto (a descrição também é em negrito).
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`a home pede um só arquivo de fonte em ${viewport.width}x${viewport.height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const requested = fontRequests(page);
    await page.goto('/');
    await expect(page.locator('a.persona').first()).toHaveAttribute('role', 'button');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('a.persona').first().click();
    await expect(page.locator('li[data-selected] .persona-description')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    expect([...new Set(requested)]).toEqual([
      '/_ds/fonts/m-plus-rounded-1c-latin-700-normal.woff2',
    ]);
    await context.close();
  });
}

test('a fonte chega ao conteúdo de um MFE, dentro do shadow DOM', async ({ page }) => {
  await page.goto('/recrutador/');
  await expect(page.locator('mfe-recrutador')).toContainText('Fase em construção');
  const family = await page.locator('mfe-recrutador').evaluate((host) => {
    const inside = host.shadowRoot?.querySelector('*:not(style)') ?? host;
    return getComputedStyle(inside).fontFamily;
  });
  expect(family.startsWith(`"${FAMILY}"`)).toBe(true);
});

test('a fonte tem as letras acentuadas dos quatro idiomas', async ({ page }) => {
  await page.goto('/comunidade/');
  await page.evaluate(() => document.fonts.ready);

  // Sem o glifo, o navegador cairia na fonte seguinte da lista (monoespaçada) e
  // a largura seria a mesma com e sem a fonte do site.
  const missing = await page.evaluate(async (name) => {
    await document.fonts.load(`400 40px '${name}'`);
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('Sem canvas 2d');
    const width = (font: string, text: string) => {
      context.font = font;
      return context.measureText(text).width;
    };
    return [...'áàâãéêíóôõúüçñÁÉÍÓÚÇÑ¿¡'].filter(
      (letter) =>
        width(`400 40px '${name}', monospace`, letter) === width('400 40px monospace', letter),
    );
  }, FAMILY);
  expect(missing).toEqual([]);
});

test.describe('sem a fonte (rede lenta ou bloqueada)', () => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ]) {
    test(`a home continua cabendo na janela em ${viewport.width}x${viewport.height}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.route('**/*.woff2', (route) => route.abort());
      // Em espanhol as frases são as mais longas.
      await page.goto('/es/');

      const fit = await page.evaluate(() => ({
        page: document.documentElement.scrollHeight,
        window: innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        windowWidth: innerWidth,
      }));
      expect(fit.page).toBeLessThanOrEqual(fit.window);
      expect(fit.pageWidth).toBeLessThanOrEqual(fit.windowWidth);
      await context.close();
    });
  }
});

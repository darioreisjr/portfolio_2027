import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Pop-up de imersão da home (docs/plans/home-imersao.md). Os outros specs
// começam com a resposta já dada (playwright.config.ts); aqui é a primeira visita.
const KEY = 'portfolio:home-animacoes';
const firstVisit = { cookies: [], origins: [] };

test.use({ storageState: firstVisit, viewport: { width: 1280, height: 800 } });

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Antes de começar' });
const immersion = (page: Page) => page.getByRole('checkbox', { name: 'Ativar imersão total' });
const start = (page: Page) => page.getByRole('button', { name: 'Começar' });
const sound = (page: Page) => page.locator('#home-music-slot button');
const pause = (page: Page) => page.locator('.home-motion input');
const petal = (page: Page) => page.locator('.sakura-petal').first();
const answer = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);

test('na primeira visita o pop-up abre, com a caixa desmarcada e o foco no "Começar"', async ({
  page,
}) => {
  const audio: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'media') audio.push(request.url());
  });
  await page.goto('/');

  await expect(dialog(page)).toBeVisible();
  await expect(immersion(page)).not.toBeChecked();
  await expect(immersion(page)).toHaveAccessibleDescription('Música e animações ligadas');
  await expect(start(page)).toBeFocused();
  expect(await answer(page)).toBeNull();
  // O resto da página fica fora de alcance enquanto o pop-up está aberto.
  const reachable = await page
    .locator('a.persona')
    .first()
    .evaluate((persona) => {
      const { x, y, width, height } = persona.getBoundingClientRect();
      return persona.contains(document.elementFromPoint(x + width / 2, y + height / 2));
    });
  expect(reachable).toBe(false);
  // Nenhum áudio antes da resposta.
  expect(audio).toEqual([]);
});

test('sem marcar: som desligado, animações pausadas, e o pop-up não volta', async ({ page }) => {
  await page.goto('/');
  await start(page).click();

  await expect(dialog(page)).toBeHidden();
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(pause(page)).toBeChecked();
  await expect(petal(page)).toHaveCSS('animation-play-state', 'paused');
  expect(await answer(page)).toBe('off');

  await page.reload();
  await expect(sound(page)).toBeVisible();
  await expect(dialog(page)).toBeHidden();
  // A pausa é lembrada.
  await expect(pause(page)).toBeChecked();
  await expect(petal(page)).toHaveCSS('animation-play-state', 'paused');
});

test('com imersão total: a música toca, as animações rodam e a resposta fica guardada', async ({
  page,
}) => {
  await page.goto('/');
  await immersion(page).check();
  await start(page).click();

  await expect(dialog(page)).toBeHidden();
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => document.querySelector('audio')?.paused)).toBe(false);
  await expect(pause(page)).not.toBeChecked();
  await expect(petal(page)).toHaveCSS('animation-play-state', 'running');
  expect(await answer(page)).toBe('on');
  expect(await page.evaluate(() => localStorage.getItem('portfolio:musica'))).toBe('on');

  await page.reload();
  await expect(sound(page)).toBeVisible();
  await expect(dialog(page)).toBeHidden();
  await expect(pause(page)).not.toBeChecked();
});

test('o botão de pausa do canto atualiza o que fica lembrado', async ({ page }) => {
  await page.goto('/');
  await start(page).click();
  await expect(pause(page)).toBeChecked();

  await pause(page).uncheck();
  expect(await answer(page)).toBe('on');
  await page.reload();
  await expect(sound(page)).toBeVisible();
  await expect(pause(page)).not.toBeChecked();
  await expect(petal(page)).toHaveCSS('animation-play-state', 'running');

  await pause(page).check();
  expect(await answer(page)).toBe('off');
});

test('a bandeira troca o idioma na hora e o pop-up volta traduzido', async ({ page }) => {
  await page.goto('/');
  const flags = dialog(page).getByRole('list', { name: 'Idioma' });
  // O idioma em uso está marcado e não é link.
  await expect(flags.getByRole('img', { name: 'Português (Brasil)' })).toBeVisible();
  await expect(flags.getByRole('link')).toHaveCount(2);

  await flags.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  const english = page.getByRole('dialog', { name: 'Before you start' });
  await expect(english).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Turn on full immersion' })).not.toBeChecked();

  await page.getByRole('button', { name: 'Start' }).click();
  await expect(english).toBeHidden();
  // Respondido em um idioma, não volta em outro.
  await page.goto('/es/');
  await expect(sound(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('pelo teclado: o Tab fica no pop-up, Espaço marca e Esc fecha valendo a caixa', async ({
  page,
}) => {
  await page.goto('/');
  await expect(start(page)).toBeFocused();

  // Uma volta inteira de Tab passa só pelos controles do pop-up.
  const focused: (string | null)[] = [];
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press('Tab');
    focused.push(
      await page.evaluate(
        () =>
          document.activeElement?.closest('dialog')?.id ?? document.activeElement?.tagName ?? null,
      ),
    );
  }
  // Fora do diálogo o foco só pode ir para a interface do navegador (BODY).
  expect(focused.filter((where) => where !== 'home-intro' && where !== 'BODY')).toEqual([]);
  expect(focused).toContain('home-intro');

  await immersion(page).focus();
  await expect(immersion(page)).not.toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Space');
  await expect(immersion(page)).toBeChecked();

  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(pause(page)).not.toBeChecked();
  expect(await answer(page)).toBe('on');
  // Depois de fechar, o foco não fica preso em um elemento invisível.
  expect(await page.evaluate(() => document.activeElement?.closest('dialog'))).toBeNull();
});

test('clicar fora não fecha nem responde', async ({ page }) => {
  await page.goto('/');
  await expect(dialog(page)).toBeVisible();
  await page.mouse.click(20, 400);
  await expect(dialog(page)).toBeVisible();
  expect(await answer(page)).toBeNull();
});

test('quem tinha o som lembrado e recusa a imersão fica sem som', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('semeado')) {
      localStorage.setItem('portfolio:musica', 'on');
      sessionStorage.setItem('semeado', '1');
    }
  });
  await page.goto('/');
  // Cliques dentro do pop-up não contam como o primeiro gesto que religa o som.
  await immersion(page).check();
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');
  await immersion(page).uncheck();
  await start(page).click();

  await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('portfolio:musica'))).toBeNull();
  await page.locator('h1').click();
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');
});

test('com movimento reduzido o pop-up oferece só a música', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', storageState: firstVisit });
  const page = await context.newPage();
  await page.goto('/');

  await expect(dialog(page)).toBeVisible();
  await expect(immersion(page)).toHaveAccessibleDescription('Música ligada');
  await expect(dialog(page)).toHaveCSS('animation-name', 'none');
  await immersion(page).check();
  await start(page).click();
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'true');
  await context.close();
});

test('sem JavaScript o pop-up não aparece e a home funciona', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    storageState: firstVisit,
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#home-intro')).toBeHidden();
  await expect(page.locator('a.persona').first()).toBeVisible();
  await context.close();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`o pop-up passa na verificação de acessibilidade (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({
      colorScheme,
      reducedMotion: 'reduce',
      storageState: firstVisit,
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(dialog(page)).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    await context.close();
  });
}

test('aberto, o pop-up não muda o que a home baixa: oito scripts e uma fonte', async ({ page }) => {
  const fonts = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.add(new URL(request.url()).pathname);
  });
  await page.goto('/');
  await expect(dialog(page)).toBeVisible();
  await page.waitForLoadState('networkidle');
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((list) => list.map((script) => (script as HTMLScriptElement).src));
  expect(new Set(scripts).size).toBe(8);
  expect([...fonts]).toEqual(['/_ds/fonts/m-plus-rounded-1c-latin-700-normal.woff2']);
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });

  test('o pop-up cabe na tela e os controles têm alvo de toque inteiro', async ({ page }) => {
    await page.goto('/es/');
    const box = await page.getByRole('dialog').boundingBox();
    if (!box) throw new Error('pop-up sem caixa');
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(640);

    for (const control of [
      page.getByRole('link', { name: 'English' }),
      page.locator('.home-intro-immersion'),
      page.getByRole('button', { name: 'Empezar' }),
    ]) {
      const size = await control.boundingBox();
      expect(size?.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Empezar' }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

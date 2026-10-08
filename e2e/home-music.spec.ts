import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'portfolio:musica';

/** Um segundo de silêncio em WAV: os testes não dependem da faixa de verdade. */
function silence(): Buffer {
  const samples = 8000;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(8000, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples, 40);
  return Buffer.concat([header, Buffer.alloc(samples, 0x80)]);
}

/** Troca a faixa por silêncio e conta quantas vezes o áudio foi pedido. */
async function watchAudio(page: Page): Promise<{ count: () => number }> {
  let requests = 0;
  await page.route('**/_home/audio/**', (route) => {
    requests += 1;
    return route.fulfill({ contentType: 'audio/wav', body: silence() });
  });
  return { count: () => requests };
}

const music = (page: Page) => page.getByRole('button', { name: 'Música de fundo' });
const playing = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('audio')].some((audio) => !audio.paused));
const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);

/** Abre a home e espera o botão funcionar: até a hidratação ele fica invisível. */
async function openHome(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('.home-music')).toHaveAttribute('data-ready', '');
}

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

test('começa desligada e não baixa áudio na carga', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const media: string[] = [];
  page.on('request', (request) => {
    if (/\.(mp3|ogg|opus|m4a|aac|wav|webm)$/.test(new URL(request.url()).pathname)) {
      media.push(request.url());
    }
  });
  await openHome(page);

  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('audio')).not.toHaveAttribute('src');
  expect(await playing(page)).toBe(false);
  expect(await stored(page)).toBeNull();
  expect(media).toEqual([]);
  expect(errors).toEqual([]);
});

test('o botão liga, desliga e lembra a escolha', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const audio = await watchAudio(page);
  await openHome(page);

  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => playing(page)).toBe(true);
  expect(await stored(page)).toBe('on');
  expect(audio.count()).toBeGreaterThan(0);
  // A faixa repete sozinha.
  await expect(page.locator('audio')).toHaveJSProperty('loop', true);

  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await playing(page)).toBe(false);
  expect(await stored(page)).toBeNull();
  expect(errors).toEqual([]);
});

test('funciona pelo teclado, com foco visível', async ({ page }) => {
  await watchAudio(page);
  await openHome(page);

  await music(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(music(page)).toBeFocused();
  await expect(page.locator('.home-music-disc')).not.toHaveCSS('outline-style', 'none');

  await page.keyboard.press('Enter');
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => playing(page)).toBe(true);
  await page.keyboard.press('Space');
  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await playing(page)).toBe(false);
});

test.describe('visita com a música lembrada', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'on'), STORAGE_KEY);
  });

  test('o botão já vem ligado e a música começa no primeiro gesto', async ({ page }) => {
    const audio = await watchAudio(page);
    await openHome(page);

    await expect(music(page)).toHaveAttribute('aria-pressed', 'true');
    // Em silêncio e sem baixar nada, até a pessoa interagir com a página.
    expect(await playing(page)).toBe(false);
    expect(audio.count()).toBe(0);

    await page.locator('h1').click();
    await expect.poll(() => playing(page)).toBe(true);
    expect(audio.count()).toBeGreaterThan(0);
  });

  test('dá para desligar antes de qualquer som, sem baixar a faixa', async ({ page }) => {
    const audio = await watchAudio(page);
    await openHome(page);

    await music(page).click();
    await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
    expect(await playing(page)).toBe(false);
    expect(audio.count()).toBe(0);

    // Desligada, nenhum gesto a religa.
    await page.locator('h1').click();
    expect(await playing(page)).toBe(false);
    expect(audio.count()).toBe(0);
  });
});

test('pausa com a aba escondida e volta de onde parou', async ({ page }) => {
  await watchAudio(page);
  await openHome(page);
  await music(page).click();
  await expect.poll(() => playing(page)).toBe(true);

  const setHidden = (hidden: boolean) =>
    page.evaluate((value) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);

  await setHidden(true);
  expect(await playing(page)).toBe(false);
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');

  await setHidden(false);
  await expect.poll(() => playing(page)).toBe(true);
});

test('a música para ao sair da home, também pela navegação do Next.js', async ({ page }) => {
  await watchAudio(page);
  await openHome(page);
  await music(page).click();
  await expect.poll(() => playing(page)).toBe(true);

  // O "Entrar" da comunidade é navegação do Next.js: o documento continua o mesmo.
  await page.getByRole('button', { name: 'Vim aprender e trocar ideias' }).click();
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/comunidade\/$/);
  await expect(page.locator('.home-music')).toHaveCount(0);
  expect(await playing(page)).toBe(false);
});

test('escolher um personagem e mexer na música não se atrapalham', async ({ page }) => {
  await watchAudio(page);
  await openHome(page);
  await page.locator('a.persona').nth(1).click();
  await expect(page.locator('ul.personas')).toHaveAttribute('data-selected', '');

  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('ul.personas')).toHaveAttribute('data-selected', '');
});

test('só a home tem o botão, no grupo do canto, antes da pausa', async ({ page }) => {
  await openHome(page);
  const [musicBox, pauseBox] = [
    await page.locator('.ds-dock .home-music').boundingBox(),
    await page.locator('.ds-dock .home-motion').boundingBox(),
  ];
  expect(musicBox?.width).toBe(44);
  expect(musicBox?.height).toBe(44);
  expect(musicBox?.y).toBe(pauseBox?.y);
  expect((musicBox?.x ?? 0) + (musicBox?.width ?? 0)).toBeLessThanOrEqual(pauseBox?.x ?? 0);

  for (const path of ['/comunidade/', '/recrutador/']) {
    await page.goto(path);
    await expect(page.locator('.home-music')).toHaveCount(0);
    await expect(page.locator('audio')).toHaveCount(0);
  }
});

test('sem JavaScript o botão não aparece, mas o lugar dele fica guardado', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const button = page.locator('.home-music');
  await expect(button).toHaveCSS('visibility', 'hidden');
  expect((await button.boundingBox())?.width).toBe(44);
  await context.close();
});

for (const colorScheme of ['light', 'dark'] as const) {
  for (const pressed of ['false', 'true']) {
    test(`o grupo passa na verificação de acessibilidade (${colorScheme}, música ${pressed})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      // Ligada sem som: uma visita com a escolha lembrada, antes do primeiro gesto.
      if (pressed === 'true') {
        await page.addInitScript((key) => localStorage.setItem(key, 'on'), STORAGE_KEY);
      }
      await openHome(page, '/en/');
      await expect(page.getByRole('button', { name: 'Background music' })).toHaveAttribute(
        'aria-pressed',
        pressed,
      );

      const { violations } = await new AxeBuilder({ page }).include('.ds-dock').analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);
      await context.close();
    });
  }
}

test('se o arquivo de áudio falhar, o botão volta a desligado e nada é lembrado', async ({
  page,
}) => {
  await page.route('**/_home/audio/**', (route) => route.fulfill({ status: 404, body: '' }));
  await openHome(page);

  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await playing(page)).toBe(false);
  expect(await stored(page)).toBeNull();
});

test('em 360 px o grupo com seis controles cabe e não encosta no painel', async ({ browser }) => {
  // Com movimento: a pausa também está no grupo.
  const context = await browser.newContext({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await openHome(page, '/es/');

  const dock = await page.locator('.ds-dock').boundingBox();
  if (!dock) throw new Error('sem grupo do canto');
  expect(dock.x).toBeGreaterThanOrEqual(0);
  expect(dock.width).toBe(6 * 44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  await page.locator('a.persona').first().tap();
  await expect(page.getByRole('button', { name: 'Volver' })).toBeVisible();
  const back = await page.locator('li[data-selected] .persona-back').boundingBox();
  expect((back?.y ?? 0) + (back?.height ?? 0)).toBeLessThanOrEqual(dock.y);
  await context.close();
});

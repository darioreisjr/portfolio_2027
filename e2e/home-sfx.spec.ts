import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'portfolio:musica';

// Notas de lib/sfx.ts, em Hz arredondado.
const PERSONAS = [440, 466.16, 587.33, 622.25];
const OPTION = [783.99];
const ENTER = [587.33, 783.99, 1174.66];
const CANCEL = [311.13, 293.66];
const ON = [880];

interface Spy {
  contexts: AudioContext[];
  notes: number[];
}

/**
 * Espião de áudio, posto antes dos scripts da página: conta os contextos
 * criados e guarda a frequência de cada nota disparada. Nada disso existe no
 * código do site. A faixa da música é trocada por um arquivo vazio.
 */
async function spyOnSound(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const spy: Spy = { contexts: [], notes: [] };
    (window as unknown as { spy: Spy }).spy = spy;
    const Real = window.AudioContext;
    window.AudioContext = class extends Real {
      constructor(options?: AudioContextOptions) {
        super(options);
        spy.contexts.push(this);
      }
    };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (when?: number) {
      spy.notes.push(Number(this.frequency.value.toFixed(2)));
      start.call(this, when);
    };
  });
  await page.route('**/_home/audio/**', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: silence() }),
  );
}

/** Um segundo de silêncio em WAV, no lugar da faixa. */
function silence(): Buffer {
  const samples = 8000;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(8000, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples, 40);
  return Buffer.concat([header, Buffer.alloc(samples, 0x80)]);
}

/**
 * Depois de confirmar ou cancelar, passar o mouse fica mudo enquanto os
 * personagens se movem (0,9 s em lib/sfx.ts).
 */
const settle = (page: Page) => page.waitForTimeout(1000);

const contexts = (page: Page) =>
  page.evaluate(() => (window as unknown as { spy: Spy }).spy.contexts.length);
/** Devolve as notas disparadas desde a última leitura. */
const takeNotes = (page: Page) =>
  page.evaluate(() => (window as unknown as { spy: Spy }).spy.notes.splice(0));
const running = (page: Page) =>
  page.evaluate(() => (window as unknown as { spy: Spy }).spy.contexts[0]?.state === 'running');

const sound = (page: Page) => page.getByRole('button', { name: 'Som' });
const personas = (page: Page) => page.locator('a.persona');
const enter = (page: Page) => page.getByRole('link', { name: 'Entrar' });
const back = (page: Page) => page.getByRole('button', { name: 'Voltar' });

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.home-music-slot .home-music')).toBeVisible();
  await expect(personas(page).first()).toHaveAttribute('role', 'button');
}

/** Abre a home, liga o som e espera o áudio estar pronto. */
async function openWithSound(page: Page): Promise<void> {
  await spyOnSound(page);
  await openHome(page);
  await sound(page).click();
  await expect.poll(() => running(page)).toBe(true);
  // Ligar toca uma nota, para confirmar que funciona.
  expect(await takeNotes(page)).toEqual(ON);
  await settle(page);
  // O ponteiro sai de cima do botão para um lugar que não faz som.
  await page.mouse.move(640, 60);
}

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

test('com o som desligado nada toca e nenhum contexto de áudio é criado', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await spyOnSound(page);
  await openHome(page);

  await personas(page).nth(1).hover();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await personas(page).nth(2).click();
  await back(page).hover();
  await enter(page).hover();
  await page.keyboard.press('Escape');

  expect(await contexts(page)).toBe(0);
  expect(await takeNotes(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('cada personagem tem a própria nota ao passar o mouse', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openWithSound(page);

  for (const [index, note] of PERSONAS.entries()) {
    await personas(page).nth(index).hover();
    expect(await takeNotes(page), `personagem ${index + 1}`).toEqual([note]);
    // Mover dentro do mesmo personagem não repete a nota.
    const box = await personas(page).nth(index).boundingBox();
    if (!box) throw new Error('personagem sem caixa');
    await page.mouse.move(box.x + box.width / 2 + 5, box.y + box.height / 3);
    expect(await takeNotes(page)).toEqual([]);
    await page.mouse.move(640, 60);
  }
  expect(await contexts(page)).toBe(1);
  expect(errors).toEqual([]);
});

test('escolher confirma com a nota do personagem e a oitava; as opções têm a nota delas', async ({
  page,
}) => {
  await openWithSound(page);

  await personas(page).nth(2).click();
  // Passar o mouse antes do clique dá a nota do personagem; o clique, o confirmar.
  // O foco posto no "Entrar" pelo site não soa por cima.
  expect(await takeNotes(page)).toEqual([587.33, 587.33, 1174.66]);
  await settle(page);

  await back(page).hover();
  expect(await takeNotes(page)).toEqual(OPTION);
  await page.waitForTimeout(80);
  await enter(page).hover();
  expect(await takeNotes(page)).toEqual(OPTION);
});

test('"Voltar", Esc e clicar fora cancelam com duas notas graves', async ({ page }) => {
  await openWithSound(page);

  await personas(page).nth(0).click();
  await takeNotes(page);
  await settle(page);
  await back(page).click();
  // O hover no "Voltar" e depois o cancelar.
  expect(await takeNotes(page)).toEqual([...OPTION, ...CANCEL]);

  await page.mouse.move(640, 60);
  await personas(page).nth(0).click();
  // O ponteiro sai de cima dos personagens: ao desfazer eles voltam ao lugar, e
  // quem ficasse embaixo dele tocaria a própria nota.
  await page.mouse.move(640, 60);
  await settle(page);
  await takeNotes(page);
  await page.keyboard.press('Escape');
  expect(await takeNotes(page)).toEqual(CANCEL);

  // Sem nada escolhido, Esc não faz som.
  await page.keyboard.press('Escape');
  expect(await takeNotes(page)).toEqual([]);

  await page.mouse.move(640, 60);
  await personas(page).nth(3).click();
  await takeNotes(page);
  await settle(page);
  await page.locator('h1').click();
  expect(await takeNotes(page)).toEqual(CANCEL);
});

test('duplo clique escolhe e confirma uma vez só', async ({ page }) => {
  await openWithSound(page);
  await personas(page).nth(1).dblclick();
  await expect(page.locator('ul.personas')).toHaveAttribute('data-selected', '');
  expect(await takeNotes(page)).toEqual([466.16, 466.16, 932.33]);
});

test('"Entrar" toca as três notas de confirmação', async ({ page }) => {
  await openWithSound(page);
  await personas(page).nth(3).click();
  await takeNotes(page);
  await settle(page);
  // Toda área é outro documento, e as notas se perdem com a troca de página.
  // O teste segura só o temporizador da transição, para ler as notas no
  // documento da home; o resto da página segue igual.
  await page.evaluate(() => {
    const original = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...rest: unknown[]) =>
      delay === 450 ? 0 : original(handler, delay, ...rest)) as typeof window.setTimeout;
  });
  await enter(page).click();
  await expect(page.locator('#home-enter')).toBeVisible();
  // O hover no "Entrar" e depois a confirmação.
  expect(await takeNotes(page)).toEqual([...OPTION, ...ENTER]);

  // Fora da home, silêncio: a página da área não tem áudio nenhum.
  await page.goto('/comunidade/');
  await page.mouse.move(300, 300);
  await page.keyboard.press('Tab');
  await page.locator('h1').click();
  expect(await page.evaluate(() => document.querySelectorAll('audio').length)).toBe(0);
});

test('pelo teclado, chegar em um personagem ou em uma opção toca a nota', async ({ page }) => {
  await openWithSound(page);

  await page.getByRole('button', { name: 'Tema escuro' }).focus();
  await page.keyboard.press('Tab');
  await expect(personas(page).nth(0)).toBeFocused();
  expect(await takeNotes(page)).toEqual([PERSONAS[0]]);

  // Duas notas de foco em menos de 30 ms viram uma só (de propósito); uma pessoa
  // não aperta tão depressa, mas o teste sim.
  await page.waitForTimeout(80);
  await page.keyboard.press('ArrowRight');
  expect(await takeNotes(page)).toEqual([PERSONAS[1]]);
  await page.waitForTimeout(80);
  await page.keyboard.press('End');
  expect(await takeNotes(page)).toEqual([PERSONAS[3]]);

  // Enter escolhe: só o confirmar, sem a nota do foco que vai para o "Entrar".
  await page.keyboard.press('Enter');
  expect(await takeNotes(page)).toEqual([622.25, 1244.51]);
  await settle(page);
  await page.keyboard.press('Tab');
  await expect(back(page)).toBeFocused();
  expect(await takeNotes(page)).toEqual(OPTION);
});

test('na visita com o som lembrado, passar o mouse só soa depois do primeiro gesto', async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'on'), STORAGE_KEY);
  await spyOnSound(page);
  await openHome(page);
  // Sem som ainda, o botão aparece desligado.
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');

  await personas(page).nth(1).hover();
  expect(await contexts(page)).toBe(0);
  expect(await takeNotes(page)).toEqual([]);

  // O primeiro clique já é um gesto: liga o som, e o confirmar dele toca.
  await personas(page).nth(1).click();
  expect(await takeNotes(page)).toEqual([466.16, 932.33]);
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'true');
  await settle(page);
  await expect.poll(() => running(page)).toBe(true);
  await back(page).hover();
  expect(await takeNotes(page)).toEqual(OPTION);
});

test('depois de trocar de idioma os efeitos continuam', async ({ page }) => {
  await openWithSound(page);
  await page.locator('.ds-language-switcher summary').click();
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(personas(page).first()).toHaveAttribute('role', 'button');
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'true');

  // Escolher um personagem na página nova confirma com as notas dele.
  await personas(page).nth(0).click();
  const notes = await takeNotes(page);
  expect(notes.slice(-2)).toEqual([440, 880]);
});

test('desligar o som cala os efeitos', async ({ page }) => {
  await openWithSound(page);
  await sound(page).click();
  await expect(sound(page)).toHaveAttribute('aria-pressed', 'false');

  await personas(page).nth(0).hover();
  await personas(page).nth(0).click();
  await page.keyboard.press('Escape');
  expect(await takeNotes(page)).toEqual([]);
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tocar confirma e cancela; deslizar o carrossel não faz som', async ({ page }) => {
    await spyOnSound(page);
    await openHome(page);
    await sound(page).tap();
    await expect.poll(() => running(page)).toBe(true);
    expect(await takeNotes(page)).toEqual(ON);

    await personas(page).nth(2).scrollIntoViewIfNeeded();
    await expect(page.locator('ul.personas')).toHaveAttribute('data-slide', '2');
    expect(await takeNotes(page)).toEqual([]);

    // Só o confirmar: no toque não existe a nota de "passar por cima".
    await personas(page).nth(2).tap();
    expect(await takeNotes(page)).toEqual([587.33, 1174.66]);
    await page.getByRole('button', { name: 'Voltar' }).tap();
    expect(await takeNotes(page)).toEqual(CANCEL);
  });
});

test('a home continua carregando oito arquivos de script', async ({ page }) => {
  // Cada arquivo de script a mais na carga custou cerca de 0,07 s de LCP, e a
  // home está no limite (docs/plans/home-musica.md). O código novo tem de entrar
  // nos arquivos que já existem.
  await page.goto('/');
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((list) => list.map((script) => (script as HTMLScriptElement).src));
  // Eram nove até 2026-10-10: o roteador de links do Next.js saiu da home.
  expect(new Set(scripts).size).toBe(8);
});

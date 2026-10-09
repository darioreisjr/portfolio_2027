import { expect, test, type Page } from '@playwright/test';

// Transição "corte de katana" ao entrar na área do recrutador (ADR 0010): a
// home fecha a cortina e marca a saída; o documento da área lê a marca e abre.
const KEY = 'portfolio:entrada';

test.use({ viewport: { width: 1280, height: 800 } });

const curtain = (page: Page) => page.locator('#home-enter');
const choose = async (page: Page, phrase: string) => {
  await page.getByRole('button', { name: phrase }).click();
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeFocused();
};
const arrived = (page: Page) => page.locator('html').getAttribute('data-arrival');
const mark = (page: Page) => page.evaluate((key) => sessionStorage.getItem(key), KEY);

test('"Entrar" no recrutador fecha a cortina, avisa e abre a área pelo corte', async ({ page }) => {
  await page.goto('/');
  await expect(curtain(page)).toBeHidden();
  await choose(page, 'Estou contratando');

  await page.getByRole('link', { name: 'Entrar' }).click();
  // A cortina aparece antes de a página trocar, com o aviso para leitores de tela.
  await expect(curtain(page)).toBeVisible();
  await expect(curtain(page)).toHaveAttribute('role', 'status');
  await expect(curtain(page)).toHaveText('Entrando...');
  await expect(curtain(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  await expect(page).toHaveURL(/\/recrutador\/$/);
  // A área leu a marca antes de pintar e a consumiu.
  expect(await arrived(page)).toBe('');
  expect(await mark(page)).toBeNull();
  await expect(page.locator('.area-arrival')).toHaveCSS('pointer-events', 'none');
  // A cortina se abre e a página fica à vista e utilizável.
  await expect
    .poll(() =>
      page
        .locator('.area-arrival')
        .evaluate((element) => getComputedStyle(element, '::before').translate),
    )
    .toBe('-100% -100%');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recrutador');
});

test('pelo teclado o Enter no "Entrar" passa pela mesma transição', async ({ page }) => {
  await page.goto('/es/');
  await page.getByRole('button', { name: 'Estoy contratando' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(curtain(page)).toHaveText('Entrando...');
  await expect(page).toHaveURL(/\/es\/reclutador\/$/);
  expect(await arrived(page)).toBe('');
});

test('com movimento reduzido o link abre direto, sem cortina nem chegada', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await choose(page, 'Estou contratando');
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  expect(await arrived(page)).toBeNull();
  expect(await mark(page)).toBeNull();
  await context.close();
});

test('com as animações pausadas o link abre direto', async ({ page }) => {
  await page.goto('/');
  await page.locator('.home-motion input').check();
  await choose(page, 'Estou contratando');
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  expect(await arrived(page)).toBeNull();
});

test('Ctrl+clique abre a área em outra aba, sem cortina', async ({ page, context }) => {
  await page.goto('/');
  await choose(page, 'Estou contratando');
  const [opened] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Entrar' }).click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await opened.waitForLoadState();
  expect(new URL(opened.url()).pathname).toBe('/recrutador/');
  await expect(curtain(page)).toBeHidden();
  expect(new URL(page.url()).pathname).toBe('/');
  // A aba nova não recebeu marca: abre sem a chegada.
  expect(await opened.locator('html').getAttribute('data-arrival')).toBeNull();
});

test('as outras áreas continuam abrindo na hora', async ({ page }) => {
  await page.goto('/');
  await choose(page, 'Quero ver o código');
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/tecnico\/$/);
  expect(await arrived(page)).toBeNull();
});

test('abrir a área direto, ou com uma marca velha, não mostra a chegada', async ({ page }) => {
  await page.goto('/recrutador/');
  expect(await arrived(page)).toBeNull();
  await expect(page.locator('.area-arrival')).toBeHidden();

  // Marca de mais de cinco segundos: a navegação não foi a da transição.
  await page.evaluate((key) => sessionStorage.setItem(key, String(Date.now() - 10_000)), KEY);
  await page.reload();
  expect(await arrived(page)).toBeNull();
  expect(await mark(page)).toBeNull();
});

test('voltar pelo navegador devolve a home sem a cortina', async ({ page }) => {
  await page.goto('/');
  await choose(page, 'Estou contratando');
  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Escolha seu caminho');
  await expect(curtain(page)).toBeHidden();
});

test('sem JavaScript o "Entrar" não existe e o personagem leva à área', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(curtain(page)).toBeHidden();
  await page.locator('a.persona').first().click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  await context.close();
});

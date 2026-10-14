import { expect, test, type Locator, type Page } from '@playwright/test';
import { NO_JS } from './support/no-js';

// Transições entre a home e as áreas que as têm (ADR 0011). Quem sai fecha a
// cortina da área e grava uma marca; o documento seguinte lê a marca antes de
// pintar e abre com a mesma cortina. Cada área tem a sua: corte de katana no
// recrutador, falha de sinal na área técnica, onda na do cliente e explosão de
// aura na comunidade.
const KEY = 'portfolio:entrada';
/** A home em pt-BR, e só ela. */
const HOME = /^http:\/\/[^/]+\/$/;

const areas = [
  {
    area: 'recruiter',
    phrase: 'Estou contratando',
    path: /\/recrutador\/$/,
    url: '/recrutador/',
    title: 'Recrutador',
    color: 'rgb(24, 121, 78)',
  },
  {
    area: 'tech',
    phrase: 'Quero ver o código',
    path: /\/tecnico\/$/,
    url: '/tecnico/',
    title: 'Técnico',
    color: 'rgb(188, 0, 45)',
  },
  {
    area: 'client',
    phrase: 'Tenho um projeto',
    path: /\/clientes\/$/,
    url: '/clientes/',
    title: 'Clientes',
    color: 'rgb(10, 111, 148)',
  },
  {
    area: 'community',
    phrase: 'Vim aprender e trocar ideias',
    path: /\/comunidade\/$/,
    url: '/comunidade/',
    title: 'Comunidade',
    color: 'rgb(12, 14, 19)',
  },
] as const;

/**
 * As cortinas da página da área. As três áreas de microfrontend usam as do
 * shell; a comunidade, que é página do Next.js, tem as próprias.
 */
const curtainsOf = (area: string) =>
  area === 'community'
    ? { arrival: '.community-arrival', departure: '.community-departure' }
    : { arrival: '.area-arrival', departure: '.area-departure' };

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

/**
 * A cortina que fecha dura menos de meio segundo e some com a navegação: olhar
 * para ela pelo teste seria correr contra a troca de página. Um observador na
 * própria página guarda como ela estava no instante em que apareceu, em
 * `sessionStorage`, que atravessa a navegação; `curtainSeen` lê depois.
 */
const watchCurtain = (page: Page, selector: string) =>
  page.locator(selector).evaluate((curtain) => {
    new MutationObserver(() => {
      if ((curtain as HTMLElement).hidden) return;
      sessionStorage.setItem(
        'teste:cortina',
        JSON.stringify({
          role: curtain.getAttribute('role'),
          text: curtain.textContent?.trim(),
          color: getComputedStyle(curtain, '::before').backgroundColor,
        }),
      );
    }).observe(curtain, { attributes: true });
  });
const curtainSeen = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('teste:cortina') ?? 'null') as unknown);

const choose = async (page: Page, phrase: string) => {
  await page.getByRole('button', { name: phrase }).click();
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeFocused();
};
const arrived = (page: Page) => page.locator('html').getAttribute('data-arrival');
/** Um pouco mais que o atraso da transição (`TRANSITION_DELAY_MS`, 0,45 s). */
const TRANSITION_WAIT = 700;
/**
 * Ctrl+clique sem abrir aba de verdade. Abrir a aba é do navegador, e depende de
 * a janela estar em primeiro plano, o que testes em paralelo disputam: era a
 * causa da instabilidade. O que cabe ao site é não interceptar o clique. Um
 * ouvinte na janela, o último a ouvir, diz se alguém chamou `preventDefault` e
 * depois cancela a navegação, para o teste continuar na mesma página.
 */
const modifiedClick = (link: Locator) =>
  link.evaluate(
    (anchor) =>
      new Promise<boolean>((resolve) => {
        window.addEventListener(
          'click',
          (event) => {
            resolve(event.defaultPrevented);
            event.preventDefault();
          },
          { once: true },
        );
        anchor.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            metaKey: true,
          }),
        );
      }),
  );
const mark = (page: Page) => page.evaluate((key) => sessionStorage.getItem(key), KEY);
/** A cor de uma das metades da cortina. */
const curtainColor = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((element) => getComputedStyle(element, '::before').backgroundColor);
/**
 * A cortina que abre terminou. Cada área tem o próprio movimento: as partes
 * saem da tela (corte, faixas e onda) ou o disco se desfaz (aura).
 */
const opened = (page: Page, selector: string) =>
  expect
    .poll(() =>
      page.locator(selector).evaluate((element) => {
        const style = getComputedStyle(element, '::before');
        return `${style.translate} | ${style.opacity}`;
      }),
    )
    .toMatch(/^(-100% (-100|0)%|0% 100%) \| 1$|^.* \| 0$/);

for (const { area, phrase, path, url, title, color } of areas) {
  const { arrival, departure } = curtainsOf(area);

  test.describe(`área ${area}`, () => {
    test('"Entrar" fecha a cortina da área, avisa e a página abre com a mesma cortina', async ({
      page,
    }) => {
      await page.goto('/');
      const curtain = page.locator('#home-enter');
      await expect(curtain).toBeHidden();
      await choose(page, phrase);
      await watchCurtain(page, '#home-enter');
      await page.getByRole('link', { name: 'Entrar' }).click();

      await expect(page).toHaveURL(path);
      // A cortina apareceu antes de a página trocar, na cor da área e com o
      // aviso para leitores de tela.
      expect(await curtainSeen(page)).toEqual({ role: 'status', text: 'Entrando...', color });
      // A área leu a marca antes de pintar e a consumiu.
      await expect(page.locator('html')).toHaveAttribute('data-arrival', area);
      expect(await mark(page)).toBeNull();
      await expect.poll(() => curtainColor(page, arrival)).toBe(color);
      await expect(page.locator(arrival)).toHaveCSS('pointer-events', 'none');
      await opened(page, arrival);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    });

    test('"Voltar" fecha a cortina, avisa e a home abre com a mesma cortina', async ({ page }) => {
      await page.goto(url);
      const curtain = page.locator(departure);
      await expect(curtain).toBeHidden();
      await watchCurtain(page, departure);
      await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();

      await expect(page).toHaveURL(HOME);
      expect(await curtainSeen(page)).toEqual({ role: 'status', text: 'Voltando...', color });
      await expect(page.locator('h1')).toHaveText('Escolha seu caminho');
      await expect(page.locator('html')).toHaveAttribute('data-arrival', area);
      expect(await mark(page)).toBeNull();
      await expect.poll(() => curtainColor(page, '.home-arrival')).toBe(color);
      await expect(page.locator('.home-arrival')).toHaveCSS('pointer-events', 'none');
      await opened(page, '.home-arrival');
      // A home fica utilizável por baixo da cortina aberta.
      await choose(page, phrase);
    });

    test('com movimento reduzido os dois links abrem direto', async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await choose(page, phrase);
      await page.getByRole('link', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(path);
      expect(await arrived(page)).toBeNull();
      expect(await mark(page)).toBeNull();

      await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
      await expect(page).toHaveURL(HOME);
      expect(await arrived(page)).toBeNull();
      await context.close();
    });

    test('com as animações pausadas os dois links abrem direto', async ({ page }) => {
      await page.goto('/');
      await page.locator('.home-motion input').check();
      await choose(page, phrase);
      await page.getByRole('link', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(path);
      expect(await arrived(page)).toBeNull();

      await page.locator('.area-motion input').check();
      await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
      await expect(page).toHaveURL(HOME);
      expect(await arrived(page)).toBeNull();
    });

    test('Ctrl+clique fica com o navegador: sem cortina e sem marca, na ida e na volta', async ({
      page,
    }) => {
      await page.goto('/');
      await choose(page, phrase);
      const enter = page.getByRole('link', { name: 'Entrar' });
      await expect(enter).toHaveAttribute('href', url);
      // O site não pode interceptar o clique com tecla modificadora.
      expect(await modifiedClick(enter)).toBe(false);
      await page.waitForTimeout(TRANSITION_WAIT);
      await expect(page.locator('#home-enter')).toBeHidden();
      expect(await mark(page)).toBeNull();
      await expect(page).toHaveURL(HOME);

      await page.goto(url);
      // Nas áreas do shell o ouvinte do botão de volta só existe depois do script.
      if (area !== 'community') {
        await expect(page.locator('main')).toHaveAttribute('data-ready', area);
      }
      const back = page.getByRole('link', { name: 'Voltar à escolha de perfil' });
      expect(await modifiedClick(back)).toBe(false);
      await page.waitForTimeout(TRANSITION_WAIT);
      await expect(page.locator(departure)).toBeHidden();
      expect(await mark(page)).toBeNull();
      await expect(page).toHaveURL(path);
    });

    test('voltar pelo navegador devolve cada página sem a cortina fechada', async ({ page }) => {
      await page.goto('/');
      await choose(page, phrase);
      await page.getByRole('link', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(path);
      await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
      await expect(page).toHaveURL(HOME);

      await page.goBack();
      await expect(page).toHaveURL(path);
      await expect(page.locator(departure)).toBeHidden();
      await page.goBack();
      await expect(page.locator('h1')).toHaveText('Escolha seu caminho');
      await expect(page.locator('#home-enter')).toBeHidden();
    });
  });
}

test('pelo teclado o Enter passa pelas mesmas transições', async ({ page }) => {
  await page.goto('/es/');
  await page.getByRole('button', { name: 'Estoy contratando' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeFocused();
  await watchCurtain(page, '#home-enter');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/es\/reclutador\/$/);
  expect(await curtainSeen(page)).toMatchObject({ text: 'Entrando...' });
  await expect(page.locator('html')).toHaveAttribute('data-arrival', 'recruiter');
  // O botão de volta só ganha a transição depois que o script do shell carrega.
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'recruiter');

  await page.getByRole('link', { name: 'Volver a la elección de perfil' }).focus();
  await watchCurtain(page, '.area-departure');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/es\/$/);
  expect(await curtainSeen(page)).toMatchObject({ text: 'Volviendo...' });
  await expect(page.locator('html')).toHaveAttribute('data-arrival', 'recruiter');
});

test('a página sem transição continua voltando na hora', async ({ page }) => {
  // "Como foi feito" ainda mostra a tela "em construção", sem cortina.
  await page.goto('/como-foi-feito/');
  await expect(page.locator('.area-arrival, .area-departure, .community-departure')).toHaveCount(0);
  await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
  await expect(page).toHaveURL(HOME);
  expect(await arrived(page)).toBeNull();
});

test('abrir direto, com marca velha ou de outra área, não mostra a chegada', async ({ page }) => {
  await page.goto('/recrutador/');
  expect(await arrived(page)).toBeNull();
  await expect(page.locator('.area-arrival')).toBeHidden();

  // Marca de mais de cinco segundos: a navegação não foi a da transição.
  await page.evaluate(
    (key) => sessionStorage.setItem(key, `recruiter:${Date.now() - 10_000}`),
    KEY,
  );
  await page.reload();
  expect(await arrived(page)).toBeNull();
  expect(await mark(page)).toBeNull();

  // Marca da área técnica não abre a cortina do recrutador.
  await page.evaluate((key) => sessionStorage.setItem(key, `tech:${Date.now()}`), KEY);
  await page.reload();
  expect(await arrived(page)).toBeNull();

  await page.goto('/');
  expect(await arrived(page)).toBeNull();
  await expect(page.locator('.home-arrival')).toBeHidden();
});

test('sem JavaScript os links levam às páginas, sem cortina', async ({ browser }) => {
  const context = await browser.newContext({ ...NO_JS, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#home-enter')).toBeHidden();
  await page.locator('a.persona').first().click();
  await expect(page).toHaveURL(/\/recrutador\/$/);
  await expect(page.locator('.area-departure')).toBeHidden();
  await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
  await expect(page).toHaveURL(HOME);
  await context.close();
});

test('a cortina da volta não muda o que a home baixa nem trava com a pausa lembrada', async ({
  browser,
}) => {
  // Quem recusou a imersão tem a pausa lembrada: a home marca a caixa ao abrir.
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [{ name: 'portfolio:home-animacoes', value: 'off' }],
        },
      ],
    },
  });
  const page = await context.newPage();
  await page.goto('/recrutador/');
  await page.getByRole('link', { name: 'Voltar à escolha de perfil' }).click();
  await expect(page).toHaveURL(HOME);
  await expect(page.locator('.home-motion input')).toBeChecked();
  // Mesmo com a home pausada, a cortina se abre até o fim.
  await opened(page, '.home-arrival');
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((list) => list.map((script) => (script as HTMLScriptElement).src));
  expect(new Set(scripts).size).toBe(8);
  await context.close();
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'portfolio:tema';
const SURFACE = { light: 'rgb(255, 255, 255)', dark: 'rgb(12, 14, 19)' };
const ACCENT = { light: 'rgb(29, 78, 216)', dark: 'rgb(147, 197, 253)' };

const allRoutes = [
  '/',
  '/comunidade/',
  '/como-foi-feito/',
  '/recrutador/',
  '/tecnico/',
  '/clientes/',
];

const html = (page: Page) => page.locator('html');
const toggle = (page: Page) => page.getByRole('button', { name: 'Tema escuro' });

async function expectAccessible(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test.describe('primeira visita', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`segue o sistema (${colorScheme}) sem fixar tema`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto('/comunidade/');

      await expect(html(page)).not.toHaveAttribute('data-theme');
      await expect(page.locator('body')).toHaveCSS('background-color', SURFACE[colorScheme]);
      await expect(toggle(page)).toHaveAttribute('aria-pressed', String(colorScheme === 'dark'));
      expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
      await context.close();
    });
  }
});

test.describe('escolha do visitante', () => {
  test.use({ colorScheme: 'light' });

  test('vale nas páginas Next.js, nas áreas do shell e depois de recarregar', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');

    // Área do shell: o MFE muda de tema sem código próprio.
    await page.goto('/recrutador/');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('mfe-recrutador ds-badge')).toHaveCSS(
      'background-color',
      ACCENT.dark,
    );
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/como-foi-feito/');
    await expect(page.locator('body')).toHaveCSS('background-color', SURFACE.dark);

    await page.reload();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');

    // E volta: a escolha clara vence o que estava salvo.
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    await page.goto('/tecnico/');
    await expect(page.locator('mfe-tecnico ds-badge')).toHaveCSS('background-color', ACCENT.light);
  });

  test('o botão funciona pelo teclado no cabeçalho do shell', async ({ page }) => {
    await page.goto('/clientes/');
    await toggle(page).focus();
    await page.keyboard.press('Enter');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('Space');
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
  });

  test('a página abre no tema salvo antes de qualquer script carregar', async ({
    context,
    page,
  }) => {
    await context.addInitScript((key) => localStorage.setItem(key, 'dark'), STORAGE_KEY);
    // Sem nenhum arquivo .js: só o script inline do <head> pode ter aplicado o tema.
    await page.route('**/*.js', (route) => route.abort());

    for (const path of ['/comunidade/', '/recrutador/']) {
      await page.goto(path);
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
      await expect(page.locator('body')).toHaveCSS('background-color', SURFACE.dark);
    }
  });

  test('todo documento traz o script de tema no <head>', async ({ request }) => {
    for (const path of allRoutes) {
      const body = await (await request.get(path)).text();
      const script = body.indexOf(`localStorage.getItem("${STORAGE_KEY}")`);
      expect(script, path).toBeGreaterThan(-1);
      expect(script, path).toBeLessThan(body.indexOf('<body'));
    }
  });

  for (const path of ['/', '/recrutador/']) {
    test(`${path} passa na verificação de acessibilidade nos dois temas`, async ({ page }) => {
      await page.goto(path);
      await expectAccessible(page);
      await toggle(page).click();
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
      await expectAccessible(page);
    });
  }
});

test.describe('sem JavaScript', () => {
  test('vale o tema do sistema e o botão fica oculto, com o espaço reservado', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/comunidade/');

    await expect(page.locator('body')).toHaveCSS('background-color', SURFACE.dark);
    const button = page.locator('ds-theme-toggle');
    await expect(button).toBeHidden();
    expect((await button.boundingBox())?.width).toBe(44);
    await context.close();
  });
});

test.describe('transição na home', () => {
  test('o céu muda em meio segundo, e na hora com movimento reduzido', async ({ browser }) => {
    const animated = await browser.newContext();
    const page = await animated.newPage();
    await page.goto('/');
    await expect(page.locator('.home')).toHaveCSS('transition-duration', /0\.5s/);
    await animated.close();

    const reduced = await browser.newContext({ reducedMotion: 'reduce' });
    const still = await reduced.newPage();
    await still.goto('/');
    await expect(still.locator('.home')).toHaveCSS('transition-duration', '0s');
    await reduced.close();
  });

  test('o céu troca de cor ao alternar o tema', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    const sky = () =>
      page.locator('.home').evaluate((home) => getComputedStyle(home).backgroundImage);

    const day = await sky();
    await toggle(page).click();
    await expect.poll(sky).not.toBe(day);
    expect(await sky()).toContain('rgb(15, 21, 53)');
    await context.close();
  });
});

test.describe('home no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('o botão de tema não encosta em texto nem no astro', async ({ page }) => {
    await page.goto('/');
    await expect(toggle(page)).toBeVisible();

    const overlaps = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
      const button = box('ds-theme-toggle');
      if (!button) throw new Error('sem botão de tema');
      return ['.home h1', '.home-identity', '.persona-phrase', '.sakura-orb'].filter((selector) => {
        const other = box(selector);
        return (
          other &&
          button.left < other.right &&
          other.left < button.right &&
          button.top < other.bottom &&
          other.top < button.bottom
        );
      });
    });
    expect(overlaps).toEqual([]);
  });
});

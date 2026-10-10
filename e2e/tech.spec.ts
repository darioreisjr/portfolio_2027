import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Página da área técnica (docs/plans/tecnico-conteudo.md). Os estudos de caso e
// as tecnologias vão ao ar como exemplo, com a faixa que os identifica; o
// raio-x do site é dado real do repositório (ADR 0012).
const area = (page: Page) => page.locator('mfe-tecnico');
const log = (page: Page) => area(page).getByRole('log');
const command = (page: Page) => area(page).getByRole('textbox', { name: 'Comando' });

test.use({ viewport: { width: 1280, height: 800 } });

for (const colorScheme of ['light', 'dark'] as const) {
  test(`a página passa na verificação de acessibilidade (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error') errors.push(entry.text());
    });
    await page.goto('/tecnico/');

    await expect(page.locator('main.area-stage')).toHaveAttribute('data-content', '');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Técnico');
    await expect(area(page).getByRole('heading', { level: 2 })).toHaveText([
      'Código, arquitetura e decisões',
      /Terminal/,
      /Estudos de caso/,
      /Stack/,
      /Raio-x deste site/,
    ]);

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    // Com saída no terminal e um filtro aplicado.
    await area(page).getByRole('button', { name: 'ajuda' }).click();
    await area(page).getByRole('button', { name: 'Back-end' }).click();
    const used = await new AxeBuilder({ page }).analyze();
    expect(used.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('todo o conteúdo está na página, sem precisar do terminal', async ({ page }) => {
  await page.goto('/tecnico/');
  // Estudos de caso, com as três partes.
  const cases = area(page).locator('.case');
  await expect(cases).toHaveCount(2);
  await expect(cases.first().locator('dt')).toHaveText(['Problema', 'Arquitetura', 'Trade-offs']);
  // Os dados fictícios levam a faixa; ela mora no bloco deles.
  await expect(area(page).locator('.example')).toHaveCount(1);
  await expect(area(page).locator('.example')).toContainText('Dados de exemplo');
  // Stack.
  await expect(area(page).locator('.skill')).toHaveCount(9);
  // Raio-x: uma linha por área e a lista de decisões.
  await expect(area(page).locator('tbody tr')).toHaveCount(6);
  await expect(area(page).locator('.decisions li').first()).toContainText('ADR 0001');
});

test('o raio-x mostra os dados reais do repositório, com a data da medição', async ({ page }) => {
  await page.goto('/tecnico/');
  const row = area(page).getByRole('row', { name: /Técnico/ });
  await expect(row.getByRole('cell').first()).toHaveText('Angular');
  // Teto da rota, de docs/quality/budgets.json.
  await expect(row).toContainText('140 kB');
  await expect(area(page).locator('.measured')).toContainText(/Medido em \d+ de \w+ de \d{4}/);
  // A barra repete o número em desenho e nunca passa do quadro.
  const fill = await row.locator('.bar i').evaluate((bar) => (bar as HTMLElement).style.inlineSize);
  expect(Number.parseFloat(fill)).toBeGreaterThan(0);
  expect(Number.parseFloat(fill)).toBeLessThanOrEqual(100);
  // Os títulos das decisões só existem em português, e dizem isso.
  await page.goto('/en/tech/');
  await expect(area(page).locator('.decisions li span[lang="pt-BR"]').first()).toBeVisible();
  await expect(area(page).locator('.measured')).toContainText(/Measured on \w+ \d+, \d{4}/);
});

test('terminal: digitar um comando responde e leva à seção, com o foco no título', async ({
  page,
}) => {
  await page.goto('/tecnico/');
  await expect(log(page)).toContainText('Digite um comando');

  await command(page).fill('projetos');
  await page.keyboard.press('Enter');
  await expect(log(page)).toContainText('2 estudos de caso');
  // O campo fica pronto para o próximo comando.
  await expect(command(page)).toHaveValue('');
  await expect(command(page)).toBeFocused();

  await log(page).getByRole('button', { name: 'Ir para a seção' }).click();
  const title = area(page).locator('#projects-title');
  await expect(title).toBeFocused();
  await expect(title).toBeInViewport();
});

test('terminal: os botões fazem o mesmo que digitar, e ajuda lista os comandos', async ({
  page,
}) => {
  await page.goto('/tecnico/');
  const shortcuts = area(page).getByRole('group', { name: 'Comandos' });
  await expect(shortcuts.getByRole('button')).toHaveText([
    'projetos',
    'stack',
    'raio-x',
    'adr',
    'ajuda',
    'limpar',
  ]);

  await shortcuts.getByRole('button', { name: 'ajuda' }).click();
  for (const name of ['projetos', 'stack', 'raio-x', 'adr', 'ajuda', 'limpar']) {
    await expect(log(page)).toContainText(name);
  }
  await shortcuts.getByRole('button', { name: 'adr' }).click();
  // O número vem do raio-x real: cresce a cada decisão registrada.
  await expect(log(page)).toContainText(/\d+ decisões de arquitetura/);
  await log(page).getByRole('button', { name: 'Ir para a seção' }).click();
  await expect(area(page).locator('#decisions-title')).toBeFocused();

  await shortcuts.getByRole('button', { name: 'limpar' }).click();
  await expect(log(page)).not.toContainText('ajuda');
  await expect(log(page)).toContainText('Digite um comando');
});

test('terminal: comando desconhecido avisa, e as setas trazem o que foi digitado', async ({
  page,
}) => {
  await page.goto('/en/tech/');
  const input = area(page).getByRole('textbox', { name: 'Command' });
  await input.fill('sudo');
  await page.keyboard.press('Enter');
  await expect(log(page)).toContainText('Command not found: sudo. Type help.');
  // Os nomes dos comandos acompanham o idioma.
  await input.fill('XRAY');
  await page.keyboard.press('Enter');
  await expect(log(page)).toContainText('6 areas measured');

  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveValue('XRAY');
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveValue('sudo');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveValue('');
});

test('o filtro da stack mostra uma categoria por vez', async ({ page }) => {
  await page.goto('/tecnico/');
  const filter = area(page).getByRole('group', { name: 'Filtrar por categoria' });
  const backend = filter.getByRole('button', { name: 'Back-end' });
  await backend.focus();
  await expect(backend).not.toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Enter');
  await expect(backend).toHaveAttribute('aria-pressed', 'true');
  await expect(area(page).locator('.skill-name')).toHaveText(['Node.js', 'API REST']);
  await filter.getByRole('button', { name: 'Todas' }).click();
  await expect(area(page).locator('.skill')).toHaveCount(9);
});

test('com movimento, os blocos entram ao rolar e a página não desloca o layout', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { cls: number }).cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) (window as unknown as { cls: number }).cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/tecnico/');
  // A abertura e o terminal, que abrem a página, nunca ficam invisíveis.
  await expect(area(page).locator('.intro')).toHaveCSS('opacity', '1');
  const last = area(page).locator('[data-reveal]').last();
  await expect(last).toHaveCSS('opacity', '0');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.1);
});

test('a pausa do canto para a falha de sinal e a varredura do terminal', async ({ page }) => {
  await page.goto('/tecnico/');
  const state = (selector: string, pseudo: string) =>
    area(page)
      .locator(selector)
      .evaluate((element, which) => getComputedStyle(element, which).animationPlayState, pseudo);
  expect(await state('.glitch', '::before')).toBe('running');
  expect(await state('.terminal', '::after')).toBe('running');
  await page.getByRole('checkbox', { name: 'Pausar animação' }).check();
  expect(await state('.glitch', '::before')).toBe('paused');
  expect(await state('.terminal', '::after')).toBe('paused');
});

test('com movimento reduzido nada nasce oculto nem se mexe', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/tecnico/');
  await expect(area(page).locator('.intro')).toBeVisible();
  const hidden = await area(page)
    .locator('[data-reveal]')
    .evaluateAll(
      (blocks) => blocks.filter((block) => getComputedStyle(block).opacity !== '1').length,
    );
  expect(hidden).toBe(0);
  const animation = await area(page)
    .locator('.glitch')
    .evaluate((title) => getComputedStyle(title, '::before').animationName);
  expect(animation).toBe('none');
  await context.close();
});

test('a página baixa no máximo dois arquivos de fonte', async ({ page }) => {
  const fonts = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.add(new URL(request.url()).pathname);
  });
  await page.goto('/tecnico/');
  await page.waitForLoadState('networkidle');
  // Código e dados usam a monoespaçada do sistema, sem arquivo.
  expect(fonts.size).toBeLessThanOrEqual(2);
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  test('cabe na largura, a tabela rola dentro do quadro e os alvos têm 44 px', async ({ page }) => {
    await page.goto('/es/tecnico/');
    await expect(area(page).getByRole('heading', { name: /Radiografía/ })).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    // A tabela larga rola na própria região, alcançável pelo teclado.
    const region = area(page).getByRole('region', { name: 'Áreas y presupuesto de JavaScript' });
    await expect(region).toHaveAttribute('tabindex', '0');
    for (const control of await area(page).locator('button, input').all()) {
      expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    // O campo não dá zoom ao focar: 16 px no mínimo.
    const size = await area(page)
      .getByRole('textbox')
      .evaluate((input) => Number.parseFloat(getComputedStyle(input).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });
});

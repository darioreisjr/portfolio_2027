import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Página "Como foi feito" (ADR 0013, docs/plans/como-foi-feito-conteudo.md).
// Server Component no Next.js sem JavaScript próprio no bundle do cliente.
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
    await page.goto('/como-foi-feito/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Como foi feito');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Composição sem Module Federation',
      '15 Decisões de Arquitetura (ADRs)',
      'Web Components Universais & Tokens CSS',
      'Métricas e Orçamentos Reais',
      'Código 100% Aberto',
    ]);

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('exibe os blocos de arquitetura, regras de fronteira e pipeline', async ({ page }) => {
  await page.goto('/como-foi-feito/');

  // Os 5 apps
  const apps = page.locator('.b-app-card');
  await expect(apps).toHaveCount(5);
  await expect(apps.locator('h4')).toHaveText([
    'Shell Vanilla',
    'MFE Vue',
    'MFE Angular',
    'MFE React',
    'Web Next',
  ]);

  // Regras de fronteira
  const rules = page.locator('.b-boundaries-list li');
  expect(await rules.count()).toBeGreaterThanOrEqual(5);

  // Pipeline de montagem
  await expect(page.locator('.b-pipeline-box')).toBeVisible();
  await expect(page.locator('.b-flow-diagram')).toContainText('pnpm build');
  await expect(page.locator('.b-flow-diagram')).toContainText('pnpm assemble');
});

test('exibe todas as 16 ADRs com títulos reais e sem banner de exemplo', async ({ page }) => {
  await page.goto('/como-foi-feito/');

  const adrs = page.locator('.b-adr-card');
  await expect(adrs).toHaveCount(16);

  // Não há faixa de exemplo em nenhum lugar da página
  await expect(page.getByText('Dados de exemplo')).toHaveCount(0);
  await expect(page.getByText('Fase em construção')).toHaveCount(0);

  // A ADR 16 aparece com status Aceito
  const adr16 = adrs.filter({ hasText: 'ADR 0016' });
  await expect(adr16).toBeVisible();
  await expect(adr16).toContainText('Assistente mascote com IA (Gemini API)');
  await expect(adr16.locator('.b-adr-status')).toHaveText('Aceito');
});

test('tabela de métricas contém os dados reais do raio-x e notas 100', async ({ page }) => {
  await page.goto('/como-foi-feito/');

  const rows = page.locator('.b-table tbody tr');
  await expect(rows).toHaveCount(6);

  // As rotas
  await expect(rows.locator('th code')).toHaveText([
    '/',
    '/recrutador/',
    '/tecnico/',
    '/clientes/',
    '/comunidade/',
    '/como-foi-feito/',
  ]);

  // Acessibilidade 100 em todas
  const scores = await rows.locator('.b-score-100').allTextContents();
  for (const score of scores) {
    expect(score).toBe('100 / 100');
  }

  // Repositório real e botão de volta
  const repoLink = page.getByRole('link', { name: 'Ver repositório no GitHub' });
  await expect(repoLink).toHaveAttribute('href', 'https://github.com/darioreisjr/portfolio_2027');
  await expect(repoLink).toHaveAttribute('target', '_blank');

  const backLink = page.getByRole('link', { name: 'Voltar à escolha de perfil' });
  await expect(backLink).toHaveAttribute('href', '/');
});

test('os textos acompanham o idioma nos três idiomas suportados', async ({ page }) => {
  // Inglês
  await page.goto('/en/how-it-was-built/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How it was built');
  await expect(page.locator('.b-subtitle')).toHaveText('Software engineering without compromises');
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(
    'Composition without Module Federation',
  );
  await expect(page.getByRole('link', { name: 'Back to profile selection' })).toHaveAttribute(
    'href',
    '/en/',
  );

  // Espanhol
  await page.goto('/es/como-se-hizo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cómo se hizo');
  await expect(page.locator('.b-subtitle')).toHaveText('Ingeniería de software sin concesiones');
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(
    'Composición sin Module Federation',
  );
  await expect(page.getByRole('link', { name: 'Volver a la elección de perfil' })).toHaveAttribute(
    'href',
    '/es/',
  );
});

test('a página tem folha própria: a home não a carrega e dispensa areas.css', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(requested.filter((path) => path.includes('how-it-was-built.css'))).toEqual([]);

  requested.length = 0;
  await page.goto('/como-foi-feito/');
  await page.waitForLoadState('networkidle');
  expect(requested).toContain('/_home/how-it-was-built.css');
  expect(requested.filter((path) => path.includes('areas.css'))).toEqual([]);

  // Nenhum script a mais que a home: a página não tem JavaScript próprio
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((list) => list.map((script) => (script as HTMLScriptElement).src));
  expect(new Set(scripts).size).toBeLessThanOrEqual(8);
});

test('com movimento reduzido não há botão de pausa e as cortinas somem', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/como-foi-feito/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Pausar animação' })).toHaveCount(0);
  await expect(page.locator('.built-arrival')).toBeHidden();

  await context.close();
});

test('ao acessar diretamente sem marca de transição a cortina de chegada fica oculta', async ({
  page,
}) => {
  await page.goto('/como-foi-feito/');
  await expect(page.locator('.built-arrival')).toBeHidden();
  await expect(page.locator('.how-it-was-built')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  test('cabe na largura e o grupo do canto não cobre o botão de volta', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 740 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/como-foi-feito/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );

    // No fim da página o botão de volta fica acessível
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const [back, dock] = [
      await page.locator('.b-back').boundingBox(),
      await page.locator('.ds-dock').boundingBox(),
    ];
    expect((back?.y ?? 0) + (back?.height ?? 0)).toBeLessThanOrEqual(dock?.y ?? 0);

    for (const link of await page.locator('.b-actions a').all()) {
      expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }

    await context.close();
  });
});

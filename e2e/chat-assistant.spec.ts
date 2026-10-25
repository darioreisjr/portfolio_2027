import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function failOnBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function expectAccessible(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test.describe('ds-chat-assistant (Assistente Mascote IA)', () => {
  test('renderiza o assistente na home e nas áreas do shell', async ({ page }) => {
    const errors = failOnBrowserErrors(page);

    // 1. Testa na Home (Next.js)
    await page.goto('/');
    const assistantHome = page.locator('ds-chat-assistant');
    await expect(assistantHome).toBeAttached();
    const triggerHome = assistantHome.locator('.chat-trigger');
    await expect(triggerHome).toBeVisible();
    await expect(triggerHome).toHaveAttribute('aria-expanded', 'false');

    // 2. Testa no Shell (/recrutador/)
    await page.goto('/recrutador/');
    const assistantShell = page.locator('ds-chat-assistant');
    await expect(assistantShell).toBeAttached();
    const triggerShell = assistantShell.locator('.chat-trigger');
    await expect(triggerShell).toBeVisible();
    await expect(triggerShell).toHaveAttribute('aria-expanded', 'false');

    expect(errors).toEqual([]);
  });

  test('abre e fecha a janela de chat pelo mouse e teclado (Escape)', async ({ page }) => {
    const errors = failOnBrowserErrors(page);
    await page.goto('/como-foi-feito/');

    const assistant = page.locator('ds-chat-assistant');
    const trigger = assistant.locator('.chat-trigger');

    // Abre o chat
    await trigger.click();

    const dialog = assistant.locator('.chat-window');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Confere a saudação inicial da Airi
    const firstBubble = assistant.locator('.message-row.model .message-bubble').first();
    await expect(firstBubble).toContainText('Sou a Airi');

    // Confere os chips de sugestão rápida
    const chips = assistant.locator('.suggestion-chip');
    await expect(chips.first()).toBeVisible();

    // Fecha com a tecla Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    expect(errors).toEqual([]);
  });

  test('interage e envia mensagem ao assistente', async ({ page }) => {
    const errors = failOnBrowserErrors(page);
    await page.goto('/');

    const assistant = page.locator('ds-chat-assistant');
    const trigger = assistant.locator('.chat-trigger');

    // Abre o chat
    await trigger.click();

    const input = assistant.locator('.chat-input');
    await expect(input).toBeFocused();

    // Clica no primeiro chip de sugestão rápida
    const firstChip = assistant.locator('.suggestion-chip').first();
    const chipText = (await firstChip.textContent())?.trim() ?? '';
    await firstChip.click();

    // A mensagem do usuário deve aparecer
    const userBubble = assistant.locator('.message-row.user .message-bubble');
    await expect(userBubble).toHaveText(chipText);

    // O assistente deve responder (resposta da Serverless Function ou fallback gracioso)
    const replies = assistant.locator('.message-row.model .message-bubble');
    await expect(replies).toHaveCount(2); // Saudação + resposta

    expect(errors).toEqual([]);
  });

  test('respeita os critérios de acessibilidade do axe com o chat aberto', async ({ page }) => {
    await page.goto('/como-foi-feito/');
    const assistant = page.locator('ds-chat-assistant');
    await assistant.locator('.chat-trigger').click();
    await expect(assistant.locator('.chat-window')).toBeVisible();

    await expectAccessible(page);
  });
});

// A assistente fica fixa no canto inferior esquerdo. No fim da página, o botão de
// volta precisa ficar acima dela: do botão redondo no celular e, acima de 640px,
// também do balão de chamada que aparece até o primeiro clique.
test.describe('a assistente não cobre o botão de volta', () => {
  const paths = ['/recrutador/', '/tecnico/', '/clientes/', '/comunidade/', '/como-foi-feito/'];
  const screens = [
    { name: 'celular', viewport: { width: 360, height: 740 }, balloon: false },
    { name: 'tela média', viewport: { width: 700, height: 600 }, balloon: true },
  ];

  for (const { name, viewport, balloon } of screens) {
    for (const path of paths) {
      test(`${path} (${name})`, async ({ browser }) => {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(path);
        const back = page.getByRole('link', { name: 'Voltar à escolha de perfil' });
        const assistant = page.locator('ds-chat-assistant');
        const covering = balloon
          ? assistant.locator('.tooltip-balloon')
          : assistant.locator('.chat-trigger');
        await expect(back).toBeVisible();
        await expect(covering).toBeVisible();

        // O conteúdo dos MFEs chega depois e alonga a página: rola de novo até o
        // fim enquanto mede, e cobra a folga entre o botão e a assistente.
        await expect
          .poll(async () => {
            await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
            const [link, corner] = [await back.boundingBox(), await covering.boundingBox()];
            return (corner?.y ?? 0) - ((link?.y ?? 0) + (link?.height ?? 0));
          })
          .toBeGreaterThanOrEqual(0);
        await context.close();
      });
    }
  }
});

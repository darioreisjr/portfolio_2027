import { expect, test } from '@playwright/test';

// Roda dentro do navegador: não pode depender de nada de fora da função.
const boxes = (elements: Element[]) =>
  elements.map((element) => {
    const { top, bottom, height } = element.getBoundingClientRect();
    return { top: Math.round(top), bottom: Math.round(bottom), height: Math.round(height) };
  });

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`os quatro personagens têm a mesma altura e a mesma base em ${viewport.width}x${viewport.height}`, async ({
    browser,
  }) => {
    // Sem movimento: as caixas são as do layout, sem a animação de entrada.
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    // Em espanhol as frases têm comprimentos diferentes entre si.
    await page.goto('/es/');

    const figures = await page.locator('img.persona-figure').evaluateAll(boxes);
    expect(figures).toHaveLength(4);
    expect(new Set(figures.map((figure) => figure.height)).size).toBe(1);
    expect(new Set(figures.map((figure) => figure.bottom)).size).toBe(1);

    // A frase fica sobre a figura, na parte de baixo dela.
    const phrases = await page.locator('.persona-phrase').evaluateAll(boxes);
    for (const [index, phrase] of phrases.entries()) {
      const figure = figures[index];
      if (!figure) throw new Error('frase sem figura');
      expect(phrase.bottom).toBeLessThanOrEqual(figure.bottom);
      expect(phrase.top).toBeGreaterThan(figure.top + figure.height / 2);
    }
    await context.close();
  });
}

test('no celular a frase fica sobre a figura e o painel abaixo dela', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('/');

  const figures = await page.locator('img.persona-figure').evaluateAll(boxes);
  const phrases = await page.locator('.persona-phrase').evaluateAll(boxes);
  const panels = await page.locator('.persona-actions').evaluateAll(boxes);
  expect(new Set(figures.map((figure) => figure.height)).size).toBe(1);
  for (const [index, figure] of figures.entries()) {
    expect(phrases[index]?.bottom).toBeLessThanOrEqual(figure.bottom);
    expect(phrases[index]?.top).toBeGreaterThan(figure.top + figure.height / 2);
    expect(panels[index]?.top).toBeGreaterThanOrEqual(figure.bottom);
  }
  await context.close();
});

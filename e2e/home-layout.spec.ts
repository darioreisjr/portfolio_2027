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
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    // Em espanhol as legendas têm comprimentos diferentes entre si.
    await page.goto('/es/');

    const figures = await page.locator('img.persona-figure').evaluateAll(boxes);
    expect(figures).toHaveLength(4);
    expect(new Set(figures.map((figure) => figure.height)).size).toBe(1);
    expect(new Set(figures.map((figure) => figure.bottom)).size).toBe(1);

    // A legenda começa depois da figura, nunca por cima dela.
    const captions = await page.locator('.persona-caption').evaluateAll(boxes);
    for (const [index, caption] of captions.entries()) {
      expect(caption.top).toBeGreaterThanOrEqual(figures[index]?.bottom ?? Infinity);
    }
    await context.close();
  });
}

test('no celular a figura fica acima da legenda em todos os personagens', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/');

  const figures = await page.locator('img.persona-figure').evaluateAll(boxes);
  const captions = await page.locator('.persona-caption').evaluateAll(boxes);
  expect(new Set(figures.map((figure) => figure.height)).size).toBe(1);
  for (const [index, caption] of captions.entries()) {
    expect(caption.top).toBeGreaterThanOrEqual(figures[index]?.bottom ?? Infinity);
  }
  await context.close();
});

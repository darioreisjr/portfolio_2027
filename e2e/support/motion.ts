import type { Page } from '@playwright/test';

/**
 * Espera as animações que têm fim (entradas, clarão da escolha) terminarem. As
 * contínuas, como o cenário, ficam de fora. Medidas de posição e de cor só
 * valem depois disso: `getBoundingClientRect` inclui o deslocamento da animação.
 */
export async function settled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });
}

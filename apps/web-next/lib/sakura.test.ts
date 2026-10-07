import { describe, expect, it } from 'vitest';
import { PETAL_COUNT, petals } from './sakura';

describe('pétalas do cenário', () => {
  it('são vinte e ficam dentro da cena', () => {
    expect(petals).toHaveLength(PETAL_COUNT);
    for (const petal of petals) {
      expect(petal.x).toBeGreaterThanOrEqual(0);
      expect(petal.x).toBeLessThanOrEqual(100);
      expect(petal.y).toBeGreaterThan(0);
      expect(petal.y).toBeLessThan(100);
    }
  });

  it('variam em tamanho, profundidade e ritmo', () => {
    for (const key of ['size', 'depth', 'pace', 'offset'] as const) {
      expect(new Set(petals.map((petal) => petal[key])).size).toBeGreaterThan(PETAL_COUNT / 2);
    }
  });

  it('se espalham pelas duas metades e balançam para os dois lados', () => {
    expect(petals.filter((petal) => petal.x < 50).length).toBeGreaterThan(5);
    expect(petals.filter((petal) => petal.x >= 50).length).toBeGreaterThan(5);
    expect(petals.some((petal) => petal.sway > 0)).toBe(true);
    expect(petals.some((petal) => petal.sway < 0)).toBe(true);
  });

  // No celular o CSS esconde as de posição par; as dez que sobram têm de cobrir a tela.
  it('continuam espalhadas quando só metade aparece', () => {
    const shown = petals.filter((_, index) => index % 2 === 0);
    expect(shown.filter((petal) => petal.x < 50).length).toBeGreaterThan(2);
    expect(shown.filter((petal) => petal.x >= 50).length).toBeGreaterThan(2);
  });
});

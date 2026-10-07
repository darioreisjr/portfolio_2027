import { describe, expect, it } from 'vitest';
import { component, primitives, semantic, semanticStatic } from './tokens.mjs';

const references = (value) =>
  [...value.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((match) => match[1]);

const semanticNames = new Set([...Object.keys(semantic.light), ...Object.keys(semanticStatic)]);

describe('tokens', () => {
  it('define todo token semântico nos dois temas', () => {
    expect(Object.keys(semantic.dark).sort()).toEqual(Object.keys(semantic.light).sort());
  });

  it('faz semânticos apontarem só para primitivos existentes', () => {
    const values = [semantic.light, semantic.dark, semanticStatic].flatMap(Object.values);
    for (const value of values) {
      for (const name of references(value)) expect(primitives).toHaveProperty(name);
    }
  });

  it('faz tokens de componente apontarem só para semânticos', () => {
    for (const value of Object.values(component)) {
      const names = references(value);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(semanticNames).toContain(name);
    }
  });

  it('não repete nome entre as camadas', () => {
    const names = [primitives, semanticStatic, semantic.light, component].flatMap(Object.keys);
    expect(new Set(names).size).toBe(names.length);
  });
});

// O texto da home fica sobre o céu ou sobre a névoa, que deixa passar 20% do que
// está atrás dela. Em qualquer dos casos o contraste tem de ser AA (4,5:1).
describe('cenário de sakura', () => {
  const hex = (theme, name) => {
    const value = { ...semanticStatic, ...semantic[theme] }[name];
    return primitives[references(value)[0]];
  };
  const channels = (color) =>
    [1, 3, 5, 7].map((at) => parseInt(color.slice(at, at + 2) || 'ff', 16));
  const luminance = ([r, g, b]) => {
    const [lr, lg, lb] = [r, g, b].map((value) => {
      const unit = value / 255;
      return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const contrast = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  const over = (top, bottom) => {
    const alpha = top[3] / 255;
    return [0, 1, 2].map((at) => top[at] * alpha + bottom[at] * (1 - alpha));
  };

  const sceneColors = Object.keys(semantic.light).filter(
    (name) => name.startsWith('color-scene-') && name !== 'color-scene-veil',
  );

  for (const theme of ['light', 'dark']) {
    for (const text of ['color-text', 'color-text-muted']) {
      it(`${text} passa em AA sobre o céu e sobre a névoa (${theme})`, () => {
        const textColor = channels(hex(theme, text));
        const veil = channels(hex(theme, 'color-scene-veil'));

        for (const sky of ['color-scene-sky-top', 'color-scene-sky-bottom']) {
          expect(contrast(textColor, channels(hex(theme, sky)))).toBeGreaterThanOrEqual(4.5);
        }
        for (const behind of sceneColors) {
          const background = over(veil, channels(hex(theme, behind)));
          expect(contrast(textColor, background), `névoa sobre ${behind}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      });
    }
  }
});

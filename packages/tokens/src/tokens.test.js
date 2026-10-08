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

// O texto da home fica direto sobre o cenário, com um contorno na cor do céu em
// volta de cada letra. Letra contra contorno tem de dar AA (4,5:1).
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
  // O seletor de tema tem disco próprio; ícone e borda precisam de 3:1 sobre ele.
  for (const theme of ['light', 'dark']) {
    it(`o seletor de tema tem ícone e borda com 3:1 sobre o disco (${theme})`, () => {
      const disc = channels(hex(theme, 'color-surface'));
      expect(contrast(channels(hex(theme, 'color-celestial')), disc)).toBeGreaterThanOrEqual(3);
      expect(contrast(channels(hex(theme, 'color-text-muted')), disc)).toBeGreaterThanOrEqual(3);
    });
  }

  // Painel do personagem escolhido: a cor da área pinta o "Entrar" (com texto por
  // cima), as linhas do "Voltar" (sobre a superfície) e a barra da descrição
  // (sobre o céu). A descrição é texto comum sobre a superfície.
  for (const theme of ['light', 'dark']) {
    for (const area of ['recruiter', 'tech', 'client', 'community']) {
      it(`a cor da área ${area} dá AA ao texto e 3:1 a bordas e barras (${theme})`, () => {
        const color = channels(hex(theme, `color-area-${area}`));
        expect(contrast(channels(hex(theme, 'color-on-area')), color)).toBeGreaterThanOrEqual(4.5);
        for (const behind of ['color-surface', 'color-scene-sky-top', 'color-scene-sky-bottom']) {
          expect(contrast(color, channels(hex(theme, behind))), behind).toBeGreaterThanOrEqual(3);
        }
      });
    }

    it(`a descrição do perfil passa em AA sobre a caixa (${theme})`, () => {
      expect(
        contrast(channels(hex(theme, 'color-text')), channels(hex(theme, 'color-surface'))),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const theme of ['light', 'dark']) {
    for (const text of ['color-text', 'color-text-muted']) {
      it(`${text} passa em AA sobre o contorno e sobre o céu (${theme})`, () => {
        const textColor = channels(hex(theme, text));
        for (const behind of [
          'color-scene-outline',
          'color-scene-sky-top',
          'color-scene-sky-bottom',
        ]) {
          expect(contrast(textColor, channels(hex(theme, behind))), behind).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      });
    }
  }
});

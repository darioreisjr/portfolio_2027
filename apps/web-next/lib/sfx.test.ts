import { describe, expect, it } from 'vitest';
import { CANCEL, ENTER, HOVER, ON, OPTION, PICK, notesFor } from './sfx';

const frequencies = (kind: number, index?: number) =>
  notesFor(kind, index).map(([frequency]) => Number(frequency.toFixed(2)));

describe('efeitos sonoros da home', () => {
  it('dá a cada personagem a própria nota, subindo na escala In', () => {
    const notes = [0, 1, 2, 3].map((index) => frequencies(HOVER, index)[0]);
    // Lá 4, Si bemol 4, Ré 5, Mi bemol 5.
    expect(notes).toEqual([440, 466.16, 587.33, 622.25]);
  });

  it('confirma a escolha com a nota do personagem e a oitava acima', () => {
    expect(frequencies(PICK, 2)).toEqual([587.33, 1174.66]);
    const [first, second] = notesFor(PICK, 2);
    expect(second?.[1]).toBeGreaterThan(first?.[1] ?? 1);
  });

  it('sobe três notas no "Entrar" e desce meio tom, no grave, ao cancelar', () => {
    expect(frequencies(ENTER)).toEqual([587.33, 783.99, 1174.66]);
    expect(frequencies(CANCEL)).toEqual([311.13, 293.66]);
  });

  it('usa uma nota só para as opções do painel e para ligar o som', () => {
    expect(frequencies(OPTION)).toEqual([783.99]);
    expect(frequencies(ON)).toEqual([880]);
  });

  it('mantém os efeitos curtos: nenhum passa de meio segundo', () => {
    for (const kind of [HOVER, OPTION, PICK, ENTER, CANCEL, ON]) {
      for (const [, delay, peak, duration] of notesFor(kind)) {
        expect(delay + duration).toBeLessThanOrEqual(0.55);
        expect(peak).toBeLessThanOrEqual(0.8);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  AREA_TRANSITIONS,
  ARRIVAL_ATTRIBUTE,
  arrivalInitScript,
  ENTRY_STORAGE_KEY,
  entryMark,
} from './arrival.js';

/** Roda o script inline com um armazenamento e um documento de mentira. */
function run(stored: string | null, accepted = AREA_TRANSITIONS) {
  const attributes = new Map<string, string>();
  const removed: string[] = [];
  const sessionStorage = {
    getItem: (key: string) => (key === ENTRY_STORAGE_KEY ? stored : null),
    removeItem: (key: string) => removed.push(key),
  };
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    },
  };
  new Function('sessionStorage', 'document', arrivalInitScript(accepted))(sessionStorage, document);
  return { attributes, removed };
}

describe('script de chegada pelas transições entre a home e as áreas', () => {
  it('liga o atributo com a área quando a marca é recente e sempre a consome', () => {
    for (const area of AREA_TRANSITIONS) {
      const { attributes, removed } = run(entryMark(area, Date.now() - 400));
      expect(attributes.get(ARRIVAL_ATTRIBUTE)).toBe(area);
      expect(removed).toEqual([ENTRY_STORAGE_KEY]);
    }
  });

  it('ignora marca velha, ausente, inválida ou de área que o documento não aceita', () => {
    const now = Date.now();
    for (const stored of [entryMark('recruiter', now - 10_000), null, 'x', String(now), ':']) {
      const { attributes, removed } = run(stored);
      expect(attributes.size, String(stored)).toBe(0);
      expect(removed).toEqual([ENTRY_STORAGE_KEY]);
    }
    // O documento da área técnica não abre com a cortina do recrutador.
    expect(run(entryMark('recruiter', now), ['tech']).attributes.size).toBe(0);
    // Área sem transição nunca liga o atributo.
    expect(run(entryMark('community', now)).attributes.size).toBe(0);
  });

  it('não quebra a página sem armazenamento', () => {
    expect(() =>
      new Function('sessionStorage', 'document', arrivalInitScript(AREA_TRANSITIONS))(
        undefined,
        {},
      ),
    ).not.toThrow();
  });

  it('pode ir dentro de um <script> sem fechar a tag', () => {
    expect(arrivalInitScript(AREA_TRANSITIONS)).not.toContain('<');
  });
});

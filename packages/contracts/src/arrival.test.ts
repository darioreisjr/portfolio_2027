import { describe, expect, it } from 'vitest';
import { ARRIVAL_ATTRIBUTE, ARRIVAL_INIT_SCRIPT, ENTRY_STORAGE_KEY } from './arrival.js';

/** Roda o script inline com um armazenamento e um documento de mentira. */
function run(stored: string | null) {
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
  new Function('sessionStorage', 'document', ARRIVAL_INIT_SCRIPT)(sessionStorage, document);
  return { attributes, removed };
}

describe('script de chegada pela transição de entrada', () => {
  it('liga o atributo quando a marca é recente e sempre a consome', () => {
    const { attributes, removed } = run(String(Date.now() - 400));
    expect(attributes.get(ARRIVAL_ATTRIBUTE)).toBe('');
    expect(removed).toEqual([ENTRY_STORAGE_KEY]);
  });

  it('ignora marca velha, ausente ou inválida', () => {
    for (const stored of [String(Date.now() - 10_000), null, 'x']) {
      const { attributes, removed } = run(stored);
      expect(attributes.size, String(stored)).toBe(0);
      expect(removed).toEqual([ENTRY_STORAGE_KEY]);
    }
  });

  it('não quebra a página sem armazenamento', () => {
    expect(() =>
      new Function('sessionStorage', 'document', ARRIVAL_INIT_SCRIPT)(undefined, {}),
    ).not.toThrow();
  });

  it('pode ir dentro de um <script> sem fechar a tag', () => {
    expect(ARRIVAL_INIT_SCRIPT).not.toContain('<');
  });
});

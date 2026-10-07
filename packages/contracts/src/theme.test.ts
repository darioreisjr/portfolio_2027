import { describe, expect, it } from 'vitest';
import {
  emitThemeChanged,
  isTheme,
  onThemeChanged,
  THEME_ATTRIBUTE,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
} from './index.js';

/** Roda o script inline com `localStorage` e `document` falsos. */
function runInitScript(getItem: (key: string) => string | null): Record<string, string> {
  const attributes: Record<string, string> = {};
  const fakeDocument = {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        attributes[name] = value;
      },
    },
  };
  new Function('localStorage', 'document', THEME_INIT_SCRIPT)({ getItem }, fakeDocument);
  return attributes;
}

describe('script inline de tema', () => {
  it('aplica o tema salvo', () => {
    const read = (key: string) => (key === THEME_STORAGE_KEY ? 'dark' : null);
    expect(runInitScript(read)).toEqual({ [THEME_ATTRIBUTE]: 'dark' });
    expect(runInitScript(() => 'light')).toEqual({ [THEME_ATTRIBUTE]: 'light' });
  });

  it('não mexe em nada sem escolha salva: vale o tema do sistema', () => {
    expect(runInitScript(() => null)).toEqual({});
  });

  it('ignora valor desconhecido', () => {
    expect(runInitScript(() => 'sepia')).toEqual({});
  });

  it('não quebra a página se o armazenamento estiver bloqueado', () => {
    const blocked = () => {
      throw new Error('bloqueado');
    };
    expect(runInitScript(blocked)).toEqual({});
  });

  // Vai dentro de uma tag <script> em HTML montado por texto.
  it('não tem caractere que feche a tag ou abra outra', () => {
    expect(THEME_INIT_SCRIPT).not.toContain('<');
  });
});

describe('tema', () => {
  it('reconhece só claro e escuro', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('system')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('entrega a troca ao ouvinte e para depois do cancelamento', () => {
    const target = new EventTarget();
    const received: unknown[] = [];
    const cancel = onThemeChanged((detail) => received.push(detail), target);

    emitThemeChanged({ theme: 'dark' }, target);
    cancel();
    emitThemeChanged({ theme: 'light' }, target);

    expect(received).toEqual([{ theme: 'dark' }]);
  });
});

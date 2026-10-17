import { describe, expect, it } from 'vitest';
import { AREA_MOTION_INIT_SCRIPT, MOTION_STORAGE_KEY } from './motion.js';

describe('pausa de movimento compartilhado', () => {
  it('usa a chave portfolio:home-animacoes', () => {
    expect(MOTION_STORAGE_KEY).toBe('portfolio:home-animacoes');
  });

  it('não contém caracteres perigosos para HTML', () => {
    expect(AREA_MOTION_INIT_SCRIPT).not.toContain('<');
  });

  it('marca a caixa de pausa quando o valor salvo é off', () => {
    let checked = false;
    const listeners: Record<string, () => void> = {};
    const fakeInput = {
      get checked() {
        return checked;
      },
      set checked(value: boolean) {
        checked = value;
      },
      addEventListener: (type: string, handler: () => void) => {
        listeners[type] = handler;
      },
    };
    const fakeDocument = {
      readyState: 'complete',
      querySelector: (selector: string) => (selector === '.area-motion input' ? fakeInput : null),
    };
    const store: Record<string, string> = { [MOTION_STORAGE_KEY]: 'off' };
    const fakeLocalStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    };

    new Function('localStorage', 'document', AREA_MOTION_INIT_SCRIPT)(
      fakeLocalStorage,
      fakeDocument,
    );

    expect(checked).toBe(true);

    // Desmarcar salva "on"
    checked = false;
    listeners['change']?.();
    expect(store[MOTION_STORAGE_KEY]).toBe('on');

    // Marcar salva "off"
    checked = true;
    listeners['change']?.();
    expect(store[MOTION_STORAGE_KEY]).toBe('off');
  });

  it('não marca a caixa quando o valor salvo é on ou nulo', () => {
    const fakeInput = {
      checked: false,
      addEventListener: () => {},
    };
    const fakeDocument = {
      readyState: 'complete',
      querySelector: () => fakeInput,
    };
    const fakeLocalStorage = {
      getItem: () => 'on',
      setItem: () => {},
    };

    new Function('localStorage', 'document', AREA_MOTION_INIT_SCRIPT)(
      fakeLocalStorage,
      fakeDocument,
    );

    expect(fakeInput.checked).toBe(false);
  });
});

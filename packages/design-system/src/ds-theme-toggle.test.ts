import '@portfolio/tokens/tokens.css';
import { onThemeChanged, THEME_ATTRIBUTE, THEME_STORAGE_KEY } from '@portfolio/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import './index.js';

const root = document.documentElement;
const systemIsDark = matchMedia('(prefers-color-scheme: dark)').matches;

async function mount() {
  const toggle = document.createElement('ds-theme-toggle');
  toggle.setAttribute('label', 'Tema escuro');
  document.body.append(toggle);
  await toggle.updateComplete;
  const button = toggle.shadowRoot?.querySelector('button');
  if (!button) throw new Error('ds-theme-toggle sem botão');
  return { toggle, button };
}

function reset() {
  document.body.replaceChildren();
  root.removeAttribute(THEME_ATTRIBUTE);
  localStorage.removeItem(THEME_STORAGE_KEY);
}

beforeEach(reset);
afterEach(reset);

describe('ds-theme-toggle', () => {
  it('é um botão com nome acessível e estado', async () => {
    const { button } = await mount();
    expect(customElements.get('ds-theme-toggle')).toBeDefined();
    expect(button.getAttribute('aria-label')).toBe('Tema escuro');
    expect(button.getAttribute('aria-pressed')).toBe(String(systemIsDark));
  });

  it('sem escolha, segue o sistema e não fixa tema', async () => {
    await mount();
    expect(root.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('respeita o tema já fixado no documento', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'dark');
    const { button } = await mount();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('o clique alterna, fixa no documento, guarda e avisa', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'light');
    const { toggle, button } = await mount();
    const heard: string[] = [];
    const cancel = onThemeChanged(({ theme }) => heard.push(theme));

    button.click();
    await toggle.updateComplete;
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    await toggle.updateComplete;
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    cancel();
    expect(heard).toEqual(['dark', 'light']);
  });

  it('acompanha a troca feita por fora, no atributo do documento', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'light');
    const { toggle, button } = await mount();

    root.setAttribute(THEME_ATTRIBUTE, 'dark');
    await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true');
    await toggle.updateComplete;
  });

  it('acompanha a escolha feita em outra aba', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'light');
    const { button } = await mount();

    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
    await expect.poll(() => button.getAttribute('aria-pressed')).toBe('true');
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
  });

  it('devolve a escolha salva se o atributo for removido', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    root.setAttribute(THEME_ATTRIBUTE, 'dark');
    await mount();

    root.removeAttribute(THEME_ATTRIBUTE);
    await expect.poll(() => root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
  });

  it('pinta o ícone de sol vermelho de dia e de lua creme à noite', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'light');
    const { toggle } = await mount();
    const icon = toggle.shadowRoot?.querySelector('svg');
    if (!icon) throw new Error('sem ícone');

    expect(getComputedStyle(icon).fill).toBe('rgb(188, 0, 45)');
    root.setAttribute(THEME_ATTRIBUTE, 'dark');
    expect(getComputedStyle(icon).fill).toBe('rgb(246, 239, 217)');
  });

  it('ocupa o tamanho do token e mostra foco de teclado', async () => {
    const { toggle, button } = await mount();
    expect(toggle.getBoundingClientRect().width).toBe(44);

    button.focus({ focusVisible: true } as FocusOptions);
    expect(getComputedStyle(button).outlineStyle).toBe('solid');
  });
});

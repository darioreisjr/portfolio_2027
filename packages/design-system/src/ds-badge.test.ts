import '@portfolio/tokens/tokens.css';
import { afterEach, describe, expect, it } from 'vitest';
import './index.js';

async function mount(): Promise<HTMLElement> {
  const badge = document.createElement('ds-badge');
  badge.textContent = 'Olá';
  document.body.append(badge);
  await badge.updateComplete;
  return badge;
}

afterEach(() => {
  document.body.replaceChildren();
  delete document.documentElement.dataset.theme;
});

describe('ds-badge', () => {
  it('registra a tag e projeta o conteúdo do light DOM', async () => {
    const badge = await mount();
    expect(customElements.get('ds-badge')).toBeDefined();
    expect(badge.shadowRoot?.querySelector('slot')).not.toBeNull();
    expect(badge.textContent).toBe('Olá');
  });

  it('usa o token de cor e muda com o tema', async () => {
    const badge = await mount();

    document.documentElement.dataset.theme = 'light';
    expect(getComputedStyle(badge).backgroundColor).toBe('rgb(29, 78, 216)');

    document.documentElement.dataset.theme = 'dark';
    expect(getComputedStyle(badge).backgroundColor).toBe('rgb(147, 197, 253)');
  });
});

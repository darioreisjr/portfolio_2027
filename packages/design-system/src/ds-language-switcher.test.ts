import '@portfolio/tokens/tokens.css';
import { languageAlternates } from '@portfolio/contracts';
import { afterEach, describe, expect, it } from 'vitest';

// Sem custom element (ADR 0006): o teste cobre a marcação de referência com o
// CSS dos tokens, que é o que o shell e o Next.js publicam.
function mount(): HTMLElement {
  const dock = document.createElement('footer');
  dock.className = 'ds-dock';
  const nav = dock.appendChild(document.createElement('nav'));
  nav.className = 'ds-language-switcher';
  nav.setAttribute('aria-label', 'Idioma');
  const list = nav.appendChild(document.createElement('ul'));
  for (const { locale, name, flag, current } of languageAlternates('home', 'es')) {
    const link = list
      .appendChild(document.createElement('li'))
      .appendChild(document.createElement('a'));
    link.href = `#${locale}`;
    link.lang = locale;
    link.hreflang = locale;
    link.setAttribute('aria-label', name);
    if (current) link.setAttribute('aria-current', 'page');
    const image = link.appendChild(document.createElement('img'));
    image.src = flag;
    image.alt = '';
    image.width = 28;
    image.height = 28;
  }
  document.body.append(dock);
  return dock;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('ds-language-switcher', () => {
  it('fica fixo no canto inferior direito', () => {
    const dock = mount();
    const box = dock.getBoundingClientRect();
    expect(getComputedStyle(dock).position).toBe('fixed');
    expect(innerWidth - box.right).toBeLessThanOrEqual(16);
    expect(innerHeight - box.bottom).toBeLessThanOrEqual(16);
  });

  it('dá a cada idioma um alvo de 44 px, em linha', () => {
    const links = [...mount().querySelectorAll('a')].map((link) => link.getBoundingClientRect());
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link.width).toBe(44);
      expect(link.height).toBe(44);
    }
    expect(new Set(links.map((link) => link.top)).size).toBe(1);
  });

  it('marca o idioma em uso com um anel afastado da bandeira', () => {
    const dock = mount();
    const offset = (selector: string) =>
      getComputedStyle(dock.querySelector(selector) as Element).outlineOffset;
    expect(offset('a[aria-current="page"] img')).toBe('2px');
    expect(offset('a:not([aria-current]) img')).toBe('0px');
  });
});

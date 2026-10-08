import '@portfolio/tokens/tokens.css';
import { languageAlternates } from '@portfolio/contracts';
import { afterEach, describe, expect, it } from 'vitest';

// Sem custom element (ADR 0006): o teste cobre a marcação de referência com o
// CSS dos tokens, que é o que o shell e o Next.js publicam.
function flag(src: string, alt: string): HTMLImageElement {
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  image.width = 28;
  image.height = 28;
  return image;
}

function mount(): HTMLDetailsElement {
  const dock = document.createElement('footer');
  dock.className = 'ds-dock';
  const nav = dock.appendChild(document.createElement('nav'));
  nav.setAttribute('aria-label', 'Idioma');
  const details = nav.appendChild(document.createElement('details'));
  details.className = 'ds-language-switcher';
  const summary = details.appendChild(document.createElement('summary'));
  const list = details.appendChild(document.createElement('ul'));
  for (const { locale, name, flag: src, current } of languageAlternates('home', 'es')) {
    if (current) {
      summary.append(flag(src, name));
      continue;
    }
    const link = list
      .appendChild(document.createElement('li'))
      .appendChild(document.createElement('a'));
    link.href = `#${locale}`;
    link.lang = locale;
    link.hreflang = locale;
    link.setAttribute('aria-label', name);
    link.append(flag(src, ''));
  }
  document.body.append(dock);
  return details;
}

const box = (element: Element | null | undefined) => {
  if (!element) throw new Error('elemento ausente');
  return element.getBoundingClientRect();
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('ds-language-switcher', () => {
  it('fica fixo no canto inferior direito, com só o idioma em uso à vista', () => {
    const details = mount();
    const dock = box(details.closest('.ds-dock'));
    expect(getComputedStyle(details.closest('.ds-dock') as Element).position).toBe('fixed');
    expect(innerWidth - dock.right).toBeLessThanOrEqual(16);
    expect(innerHeight - dock.bottom).toBeLessThanOrEqual(16);

    // Fechado: um alvo de 44 px, e os outros idiomas fora da vista.
    expect(dock.width).toBe(44);
    expect(box(details.querySelector('summary')).height).toBe(44);
    expect(details.querySelector('summary img')?.getAttribute('alt')).toBe('Español');
    for (const link of details.querySelectorAll('a')) expect(link.checkVisibility()).toBe(false);
  });

  it('aberto, os outros três idiomas sobem em coluna acima do idioma em uso', () => {
    const details = mount();
    details.open = true;
    const summary = box(details.querySelector('summary'));
    const links = [...details.querySelectorAll('a')].map(box);

    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link.width).toBe(44);
      expect(link.height).toBe(44);
      expect(link.right).toBe(summary.right);
      expect(link.bottom).toBeLessThanOrEqual(summary.top);
    }
    expect(new Set(links.map((link) => link.top)).size).toBe(3);
    // Abrir não muda o tamanho do grupo: a coluna flutua por cima.
    expect(box(details.closest('.ds-dock')).width).toBe(44);
  });

  it('marca o idioma em uso com um anel afastado da bandeira', () => {
    const details = mount();
    details.open = true;
    const offset = (selector: string) =>
      getComputedStyle(details.querySelector(selector) as Element).outlineOffset;
    expect(offset('summary img')).toBe('2px');
    expect(offset('a img')).toBe('0px');
  });
});

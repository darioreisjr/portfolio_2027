'use client';

import type { KeyboardEvent, MouseEvent, ReactNode, UIEvent } from 'react';

// Mesma largura do palco em home.css; abaixo dela a tela é um carrossel com a
// legenda sempre visível, e um toque já abre a área.
const STAGE_QUERY = '(min-width: 48rem)';

const personaLinks = (list: HTMLElement) => [
  ...list.querySelectorAll<HTMLAnchorElement>('a.persona'),
];

/**
 * Único Client Component da home. O destaque é todo em CSS; aqui ficam só as
 * duas coisas que um link não faz sozinho: no toque, o primeiro destaca e o
 * segundo abre; no teclado, as setas andam entre os personagens; no carrossel,
 * `data-slide` diz qual personagem está à vista, para os pontinhos do CSS.
 * Sem JavaScript, cada personagem continua sendo um link comum.
 */
export function PersonaList({ children }: { children: ReactNode }) {
  function handleClick(event: MouseEvent<HTMLUListElement>) {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a.persona');
    if (!link) return;

    const { pointerType } = event.nativeEvent as PointerEvent;
    const isTouch = pointerType === 'touch' || pointerType === 'pen';
    if (!isTouch || !window.matchMedia(STAGE_QUERY).matches || link.hasAttribute('data-active')) {
      return;
    }

    event.preventDefault();
    for (const other of personaLinks(event.currentTarget)) other.removeAttribute('data-active');
    link.setAttribute('data-active', '');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const links = personaLinks(event.currentTarget);
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (current === -1) return;

    const target = {
      ArrowRight: links[current + 1],
      ArrowLeft: links[current - 1],
      Home: links[0],
      End: links.at(-1),
    }[event.key];
    if (!target) return;

    event.preventDefault();
    target.focus();
  }

  function handleScroll(event: UIEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const range = list.scrollWidth - list.clientWidth;
    if (range <= 0) return;
    const last = list.children.length - 1;
    list.dataset.slide = String(Math.round((list.scrollLeft / range) * last));
  }

  return (
    <ul
      className="personas"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
    >
      {children}
    </ul>
  );
}

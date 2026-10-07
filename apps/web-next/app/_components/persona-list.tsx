'use client';

import {
  useEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type UIEvent,
} from 'react';

// Mesma largura do palco em home.css; abaixo dela a tela é um carrossel com a
// legenda sempre visível, e um toque já abre a área.
const STAGE_QUERY = '(min-width: 48rem)';

const personaLinks = (list: HTMLElement) => [
  ...list.querySelectorAll<HTMLAnchorElement>('a.persona'),
];

function clearActive(list: HTMLElement, except?: Element | null) {
  for (const link of personaLinks(list)) {
    if (link !== except) link.removeAttribute('data-active');
  }
}

/**
 * Único Client Component da home. O destaque é todo em CSS; aqui ficam só as
 * coisas que um link não faz sozinho: no toque, o primeiro destaca e o segundo
 * abre; no teclado, as setas andam entre os personagens; no carrossel,
 * `data-slide` diz qual personagem está à vista, para os pontinhos do CSS.
 * Sem JavaScript, cada personagem continua sendo um link comum.
 */
export function PersonaList({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);

  // Tocar fora da lista desfaz o destaque deixado pelo primeiro toque.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const list = listRef.current;
      if (list && !list.contains(event.target as Node)) clearActive(list);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function handleClick(event: MouseEvent<HTMLUListElement>) {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a.persona');
    if (!link) return;

    // Só dedo: mouse e caneta já destacam pelo :hover antes do clique.
    const isTouch = (event.nativeEvent as PointerEvent).pointerType === 'touch';
    if (!isTouch || !window.matchMedia(STAGE_QUERY).matches || link.hasAttribute('data-active')) {
      return;
    }

    event.preventDefault();
    clearActive(event.currentTarget, link);
    link.setAttribute('data-active', '');
    // Leva o foco junto, para leitores de tela anunciarem o personagem destacado.
    link.focus({ preventScroll: true });
  }

  // O foco indo para outro personagem não pode deixar dois em destaque.
  function handleFocus(event: FocusEvent<HTMLUListElement>) {
    clearActive(event.currentTarget, (event.target as Element).closest('a.persona'));
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
    const slide = String(Math.round((list.scrollLeft / range) * (list.children.length - 1)));
    if (list.dataset.slide !== slide) list.dataset.slide = slide;
  }

  return (
    <ul
      ref={listRef}
      className="personas"
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
    >
      {children}
    </ul>
  );
}

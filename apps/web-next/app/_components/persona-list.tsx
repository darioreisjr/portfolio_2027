'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type UIEvent,
} from 'react';

const personaLinks = (list: HTMLElement) => [
  ...list.querySelectorAll<HTMLAnchorElement>('a.persona'),
];

const selectedItem = (list: HTMLElement) =>
  list.querySelector<HTMLLIElement>(':scope > li[data-selected]');

/** Escolhe um personagem: os outros somem (CSS) e o painel dele aparece. */
function select(list: HTMLElement, item: HTMLLIElement) {
  list.setAttribute('data-selected', '');
  item.setAttribute('data-selected', '');
  item.querySelector('a.persona')?.setAttribute('aria-expanded', 'true');
  item.querySelector('.persona-actions')?.removeAttribute('hidden');
  // O foco em "Entrar" faz o leitor de tela anunciar a frase e a tecnologia.
  item.querySelector<HTMLAnchorElement>('.persona-enter')?.focus({ preventScroll: true });
}

/** Desfaz a escolha e devolve o foco ao personagem que estava escolhido. */
function deselect(list: HTMLElement) {
  const item = selectedItem(list);
  if (!item) return;
  list.removeAttribute('data-selected');
  item.removeAttribute('data-selected');
  item.querySelector('.persona-actions')?.setAttribute('hidden', '');
  const link = item.querySelector<HTMLAnchorElement>('a.persona');
  link?.setAttribute('aria-expanded', 'false');
  link?.focus({ preventScroll: true });
}

/**
 * Único Client Component da home. Sem JavaScript, cada personagem é um link
 * comum para a área. Com JavaScript, o clique escolhe o personagem na própria
 * tela, e a área só abre pelo "Entrar". O estado fica em atributos do DOM (o
 * CSS faz o resto), sem estado do React, então a lista nunca re-renderiza.
 * Também cuida das setas do teclado e da posição do carrossel (`data-slide`).
 */
export function PersonaList({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    // A partir daqui o personagem abre um painel em vez de navegar: é um botão
    // que expande, e é assim que ele se apresenta a leitores de tela.
    for (const link of personaLinks(list)) {
      link.setAttribute('role', 'button');
      link.setAttribute('aria-expanded', 'false');
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') deselect(list);
    };
    // Clicar fora desfaz. Controles da página (tema, pausa, idioma, links) não contam.
    const onClick = (event: globalThis.MouseEvent) => {
      // O personagem escolhido vai para o centro; o segundo clique de um duplo
      // clique cai onde ele estava, e não é um pedido para desfazer.
      if (event.detail > 1) return;
      const target = event.target as Element;
      if (selectedItem(list)?.contains(target)) return;
      if (target.closest('a, button, input, label, ds-theme-toggle, .ds-dock')) return;
      deselect(list);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const target = event.target as Element;

    if (target.closest('.persona-back')) {
      deselect(list);
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a.persona');
    const item = link?.closest('li');
    if (!link || !item) return;
    // Ctrl, Shift e afins abrem a área em outra aba ou janela, como em qualquer link.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    // Duplo clique escolhe uma vez só; o segundo clique não desfaz.
    if (event.detail > 1) return;

    if (item.hasAttribute('data-selected')) deselect(list);
    else select(list, item);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a.persona');
    if (!link) return;

    // Um link não reage ao Espaço; um botão, sim.
    if (event.key === ' ') {
      event.preventDefault();
      link.click();
      return;
    }
    if (selectedItem(list)) return;

    const links = personaLinks(list);
    const current = links.indexOf(link);
    const next = {
      ArrowRight: links[current + 1],
      ArrowLeft: links[current - 1],
      Home: links[0],
      End: links.at(-1),
    }[event.key];
    if (!next) return;

    event.preventDefault();
    next.focus();
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
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
    >
      {children}
    </ul>
  );
}

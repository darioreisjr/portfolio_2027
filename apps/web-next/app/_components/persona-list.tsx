'use client';

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type UIEvent,
} from 'react';

import { createPortal } from 'react-dom';
import { setupIntro } from '../../lib/intro';
import { MUSIC_SLOT_ID } from '../../lib/music';
import { ENTRY_STORAGE_KEY } from '@portfolio/contracts';
import { ENTER_OVERLAY_ID, ENTER_DELAY_MS } from '../../lib/enter';
import { CANCEL, ENTER, HOVER, OPTION, PICK, sfx, slash } from '../../lib/sfx';
import { MusicToggle } from './music-toggle';

const personaLinks = (list: HTMLElement) => [
  ...list.querySelectorAll<HTMLAnchorElement>('a.persona'),
];

const selectedItem = (list: HTMLElement) =>
  list.querySelector<HTMLLIElement>(':scope > li[data-selected]');

// O que faz som ao passar o mouse ou receber o foco (lib/sfx.ts).
const SOUNDING = 'a.persona, .persona-enter, .persona-back';

/** Toque curto de quem recebeu o ponteiro ou o foco: cada personagem tem a nota dele. */
function hoverSound(list: HTMLElement, hit: Element) {
  if (hit.matches('a.persona')) sfx(HOVER, personaLinks(list).indexOf(hit as HTMLAnchorElement));
  else sfx(OPTION);
}

// Verdadeiro enquanto o foco é movido por script: quem soa ali é o efeito de
// confirmar ou de cancelar, não o toque de foco.
let quiet = false;
function focusQuietly(element: HTMLElement | null | undefined) {
  quiet = true;
  element?.focus({ preventScroll: true });
  quiet = false;
}

/** Escolhe um personagem: os outros somem (CSS) e o painel dele aparece. */
function select(list: HTMLElement, item: HTMLLIElement) {
  list.setAttribute('data-selected', '');
  item.setAttribute('data-selected', '');
  item.querySelector('a.persona')?.setAttribute('aria-expanded', 'true');
  item.querySelector('.persona-actions')?.removeAttribute('hidden');
  sfx(PICK, [...list.children].indexOf(item));
  // O foco em "Entrar" faz o leitor de tela anunciar a frase e a descrição.
  focusQuietly(item.querySelector<HTMLAnchorElement>('.persona-enter'));
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
  sfx(CANCEL);
  focusQuietly(link);
}

/** O lugar do botão da música não muda depois de montado: não há o que assinar. */
const subscribeToNothing = () => () => {};

/**
 * Parte interativa da home. Sem JavaScript, cada personagem é um link comum para
 * a área. Com JavaScript, o clique escolhe o personagem na própria tela, e a
 * área só abre pelo "Entrar". O estado fica em atributos do DOM (o CSS faz o
 * resto), sem estado do React. Também cuida das setas do teclado, da posição
 * do carrossel (`data-slide`) e dos efeitos sonoros de seleção, que só tocam
 * com o botão de som ligado.
 *
 * O botão da música também nasce aqui e é levado por portal para o lugar dele
 * no grupo do canto, que é do layout. Assim os dois comportamentos da home saem
 * no mesmo arquivo de script: um arquivo a mais na carga custa LCP, e a home
 * está no limite (docs/plans/home-musica.md).
 */
export function PersonaList({
  children,
  music,
}: {
  children: ReactNode;
  music: { label: string; src: string };
}) {
  // No servidor e na hidratação não há lugar; logo depois, o do grupo do canto.
  const musicSlot = useSyncExternalStore(
    subscribeToNothing,
    () => document.getElementById(MUSIC_SLOT_ID),
    () => null,
  );

  const listRef = useRef<HTMLUListElement>(null);
  // O botão de som põe aqui a função que o liga e desliga; o pop-up de imersão a chama.
  const soundRef = useRef<((on: boolean) => void) | null>(null);

  // Pop-up da primeira visita e lembrança da pausa (lib/intro.ts).
  useEffect(() => setupIntro((on) => soundRef.current?.(on)), []);

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
    // Voltar pelo navegador devolve a página como estava: a cortina sai.
    const onPageShow = () => {
      const overlay = document.getElementById(ENTER_OVERLAY_ID);
      if (overlay) overlay.hidden = true;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
      removeEventListener('pageshow', onPageShow);
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const target = event.target as Element;

    if (target.closest('.persona-back')) {
      deselect(list);
      return;
    }
    const enter = target.closest<HTMLAnchorElement>('.persona-enter');
    if (enter) {
      const overlay = document.getElementById(ENTER_OVERLAY_ID);
      // Transição "corte de katana" (ADR 0010), só na área do recrutador e só
      // para um clique comum de quem não pediu menos movimento nem pausou as
      // animações. Fora disso o link navega na hora, como qualquer link.
      if (
        overlay &&
        enter.closest('li')?.dataset.area === 'recruiter' &&
        !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        !document.querySelector<HTMLInputElement>('.home-motion input')?.checked
      ) {
        event.preventDefault();
        try {
          // A área lê a marca para abrir com a animação de chegada.
          sessionStorage.setItem(ENTRY_STORAGE_KEY, String(Date.now()));
        } catch {
          // Sem armazenamento, a área abre sem a chegada.
        }
        slash();
        overlay.hidden = false;
        setTimeout(() => location.assign(enter.href), ENTER_DELAY_MS);
      } else {
        // O link navega em seguida; o som pode ser cortado pela troca de página.
        sfx(ENTER);
      }
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

  // Só o mouse faz som ao passar: no toque não existe "passar por cima".
  function handlePointerOver(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== 'mouse') return;
    const hit = (event.target as Element).closest(SOUNDING);
    // Mover o ponteiro dentro do mesmo personagem não repete a nota.
    if (!hit || hit.contains(event.relatedTarget as Node | null)) return;
    hoverSound(event.currentTarget, hit);
  }

  // Chegar pelo teclado soa como passar o mouse. Clique e toque também dão foco,
  // mas sem `:focus-visible`, e aí quem soa é a confirmação.
  function handleFocus(event: FocusEvent<HTMLUListElement>) {
    const hit = (event.target as Element).closest(SOUNDING);
    if (quiet || !hit?.matches(':focus-visible')) return;
    hoverSound(event.currentTarget, hit);
  }

  function handleScroll(event: UIEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const range = list.scrollWidth - list.clientWidth;
    if (range <= 0) return;
    const slide = String(Math.round((list.scrollLeft / range) * (list.children.length - 1)));
    if (list.dataset.slide !== slide) list.dataset.slide = slide;
  }

  return (
    <>
      <ul
        ref={listRef}
        className="personas"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onPointerOver={handlePointerOver}
        onFocus={handleFocus}
      >
        {children}
      </ul>
      {musicSlot && createPortal(<MusicToggle {...music} controlRef={soundRef} />, musicSlot)}
    </>
  );
}

import { inView, stagger } from 'motion';
import { animate } from 'motion/mini';

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Há movimento permitido? A pausa do documento chega por `--area-motion-state` (ADR 0010). */
export const moving = (host: Element): boolean =>
  typeof matchMedia === 'function' &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  getComputedStyle(host).getPropertyValue('--area-motion-state').trim() !== 'paused';

/** Conta de zero até o número escrito no elemento, como um nível que sobe. */
function countUp(element: HTMLElement): void {
  const target = Number(element.textContent);
  if (!Number.isFinite(target) || target <= 0) return;
  const started = performance.now();
  const duration = 500;
  const frame = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    element.textContent = String(Math.round(target * progress));
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/**
 * Liga o movimento da página (Motion). Só para quem não pediu menos movimento
 * nem pausou as animações; sem isso, e sem `IntersectionObserver`, tudo fica
 * visível como está. O estado inicial oculto é posto aqui, por script. Devolve a
 * função que desfaz tudo.
 */
export function animatePage(root: HTMLElement): () => void {
  if (typeof IntersectionObserver !== 'function' || !moving(root)) return () => {};

  // Janelas abaixo da abertura: abrem de cima para baixo ao chegar à tela, com a
  // varredura de luz (CSS, pela classe `open`) e os itens em cascata.
  const stops = [...root.querySelectorAll<HTMLElement>('[data-reveal]')].map((panel) => {
    panel.style.opacity = '0';
    return inView(
      panel,
      () => {
        panel.style.opacity = '';
        panel.classList.add('open');
        void animate(
          panel,
          { opacity: [0, 1], clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] },
          { duration: 0.55, ease: EASE },
        );
        const items = [...panel.querySelectorAll('[data-cascade] > *')];
        if (items.length) {
          void animate(
            items,
            { opacity: [0, 1], transform: ['translateY(14px) scale(0.98)', 'none'] },
            { duration: 0.45, delay: stagger(0.07, { startDelay: 0.2 }), ease: EASE },
          );
        }
        // "Antes" e "depois" entram de lados opostos.
        for (const side of panel.querySelectorAll<HTMLElement>('[data-from]')) {
          const offset = side.dataset.from === 'left' ? -28 : 28;
          void animate(
            side,
            { opacity: [0, 1], transform: [`translateX(${offset}px)`, 'none'] },
            { duration: 0.5, delay: 0.3, ease: EASE },
          );
        }
        panel.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
      },
      { amount: 0.12 },
    );
  });

  // Cartões que inclinam seguindo o ponteiro, só onde há ponteiro de verdade.
  const canHover = matchMedia('(hover: hover)').matches;
  const onMove = (event: PointerEvent) => {
    const card = (event.target as Element).closest<HTMLElement>('[data-tilt]');
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--tilt-x', ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    card.style.setProperty('--tilt-y', ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  };
  const onLeave = (event: PointerEvent) => {
    const card = (event.target as Element).closest<HTMLElement>('[data-tilt]');
    card?.style.removeProperty('--tilt-x');
    card?.style.removeProperty('--tilt-y');
  };
  if (canHover) {
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerout', onLeave);
  }

  return () => {
    stops.forEach((stop) => stop());
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerout', onLeave);
  };
}

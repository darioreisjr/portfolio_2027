import { inView, stagger } from 'motion';
import { animate } from 'motion/mini';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Há movimento permitido? A pausa do documento chega por `--area-motion-state` (ADR 0010). */
export const moving = (host: Element): boolean =>
  typeof matchMedia === 'function' &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  getComputedStyle(host).getPropertyValue('--area-motion-state').trim() !== 'paused';

/**
 * Entrada dos blocos marcados com `data-reveal` quando chegam à tela (Motion).
 * O estado inicial oculto é posto aqui, por script: se algo falhar, ou se não
 * houver movimento permitido, o conteúdo simplesmente fica visível. Devolve a
 * função que desfaz os observadores.
 */
export function reveal(host: Element): () => void {
  if (typeof IntersectionObserver !== 'function' || !moving(host)) return () => {};
  const blocks = [...host.querySelectorAll<HTMLElement>('[data-reveal]')];
  const stops = blocks.map((block) => {
    block.style.opacity = '0';
    return inView(
      block,
      () => {
        block.style.opacity = '';
        // O quadro entra de lado, como página virada, e os itens em cascata.
        void animate(
          block,
          { opacity: [0, 1], transform: ['translateX(-24px) skewX(-2deg)', 'none'] },
          { duration: 0.5, ease: EASE },
        );
        const items = [...block.querySelectorAll('[data-cascade] > *')];
        if (items.length) {
          void animate(
            items,
            { opacity: [0, 1], transform: ['translateY(12px)', 'none'] },
            { duration: 0.4, delay: stagger(0.05, { startDelay: 0.15 }), ease: EASE },
          );
        }
      },
      { amount: 0.1 },
    );
  });
  return () => stops.forEach((stop) => stop());
}

/** Realce curto de um trecho que acabou de mudar (filtro, saída do terminal). */
export function flash(host: Element, items: Element[]): void {
  if (!items.length || typeof Element.prototype.animate !== 'function' || !moving(host)) return;
  void animate(
    items,
    { opacity: [0, 1], transform: ['translateX(-8px)', 'none'] },
    { duration: 0.25, delay: stagger(0.03), ease: EASE },
  );
}

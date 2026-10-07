import type { AreaId, Locale } from './routes.js';

/** Emitido por um MFE quando termina de montar dentro do shell. */
export const MFE_READY = 'portfolio:mfe-pronto';

export interface MfeReadyDetail {
  area: AreaId;
  locale: Locale;
}

export function emitMfeReady(detail: MfeReadyDetail, target: EventTarget = window): void {
  target.dispatchEvent(new CustomEvent<MfeReadyDetail>(MFE_READY, { detail }));
}

/** Devolve a função que cancela a escuta. */
export function onMfeReady(
  listener: (detail: MfeReadyDetail) => void,
  target: EventTarget = window,
): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<MfeReadyDetail>).detail);
  target.addEventListener(MFE_READY, handler);
  return () => target.removeEventListener(MFE_READY, handler);
}

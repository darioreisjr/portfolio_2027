import { findRoute, onMfeReady } from '@portfolio/contracts';
import { mountMfe } from './mount.ts';

const stage = document.querySelector<HTMLElement>('main[data-area]');
// O palco é do documento; o MFE entra no lugar da mensagem (ADR 0009).
const outlet = stage?.querySelector<HTMLElement>('.area-outlet');
const match = findRoute(location.pathname);

if (stage && outlet && match?.entry.mfe) {
  // Marca visível para testes e para estilos: o MFE avisou que montou.
  onMfeReady(({ area }) => {
    stage.dataset.ready = area;
  });
  void mountMfe(outlet, match.entry.mfe, match.locale, match.entry.paths[match.locale]);
}

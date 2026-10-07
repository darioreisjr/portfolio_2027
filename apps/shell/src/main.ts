import { findRoute, onMfeReady } from '@portfolio/contracts';
import { mountMfe } from './mount.ts';

const outlet = document.querySelector<HTMLElement>('main[data-area]');
const match = findRoute(location.pathname);

if (outlet && match?.entry.mfe) {
  // Marca visível para testes e para estilos: o MFE avisou que montou.
  onMfeReady(({ area }) => {
    outlet.dataset.ready = area;
  });
  void mountMfe(outlet, match.entry.mfe, match.locale, match.entry.paths[match.locale]);
}

import {
  AREA_TRANSITIONS,
  ENTRY_STORAGE_KEY,
  entryMark,
  findRoute,
  onMfeReady,
  TRANSITION_DELAY_MS,
} from '@portfolio/contracts';
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

// Volta para a home com a cortina da área (ADR 0011). Só para um clique comum de
// quem não pediu menos movimento nem pausou as animações; fora disso, e sem
// JavaScript, o link navega na hora, como qualquer link.
const back = stage?.querySelector<HTMLAnchorElement>('a.area-back');
const departure = document.querySelector<HTMLElement>('.area-departure');
const area = match?.entry.area;

if (back && departure && area && AREA_TRANSITIONS.includes(area)) {
  back.addEventListener('click', (event) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.querySelector<HTMLInputElement>('.area-motion input')?.checked
    ) {
      return;
    }
    event.preventDefault();
    try {
      // A home lê a marca para abrir com a mesma cortina.
      sessionStorage.setItem(ENTRY_STORAGE_KEY, entryMark(area, Date.now()));
    } catch {
      // Sem armazenamento, a home abre sem a chegada.
    }
    departure.hidden = false;
    setTimeout(() => location.assign(back.href), TRANSITION_DELAY_MS);
  });
  // Voltar pelo navegador devolve a página como estava: a cortina sai.
  addEventListener('pageshow', () => {
    departure.hidden = true;
  });
}

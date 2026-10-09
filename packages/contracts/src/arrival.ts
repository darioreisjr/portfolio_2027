import type { AreaId } from './routes.js';

/**
 * Transições entre a home e uma área (ADR 0011). Quem sai grava aqui a área e a
 * hora; o documento seguinte lê a marca e abre com a cortina daquela área. O
 * sentido não é gravado: no documento da área a marca é uma entrada, na home é
 * uma volta. Fica em `sessionStorage`: vale só para a navegação seguinte, na
 * mesma aba.
 */
export const ENTRY_STORAGE_KEY = 'portfolio:entrada';

/** Atributo do `<html>` com a área da transição, enquanto a cortina de chegada está na tela. */
export const ARRIVAL_ATTRIBUTE = 'data-arrival';

/** Áreas que têm transição de entrada e de volta. Cada uma tem a própria cortina, em CSS. */
export const AREA_TRANSITIONS: readonly AreaId[] = ['recruiter', 'tech'];

/**
 * Quanto o documento espera, com a cortina fechando, antes de navegar. Acompanha
 * a duração das animações de saída em `home.css` e em `shell.css`.
 */
export const TRANSITION_DELAY_MS = 450;

/** A marca só vale por este tempo: depois disso a navegação não foi a da transição. */
const ARRIVAL_MAX_AGE_MS = 5000;

/** Valor gravado na marca: a área e a hora, separadas por dois-pontos. */
export const entryMark = (area: AreaId, now: number): string => `${area}:${now}`;

/**
 * Script que o documento põe inline no `<head>`: consome a marca e, se ela for
 * recente e de uma das áreas aceitas, liga o atributo com a área antes da
 * primeira pintura, para a página não aparecer um instante antes da cortina.
 * Devolve texto; este pacote não executa API de navegador.
 */
export const arrivalInitScript = (accepted: readonly AreaId[]): string =>
  `(function(){try{var k=${JSON.stringify(
    ENTRY_STORAGE_KEY,
  )},v=(sessionStorage.getItem(k)||"").split(":");sessionStorage.removeItem(k);if(${JSON.stringify(
    accepted,
  )}.indexOf(v[0])+1&&${ARRIVAL_MAX_AGE_MS}>Date.now()-v[1])document.documentElement.setAttribute(${JSON.stringify(
    ARRIVAL_ATTRIBUTE,
  )},v[0])}catch(e){}})()`;

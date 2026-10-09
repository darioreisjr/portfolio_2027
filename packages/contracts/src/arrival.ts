/**
 * Transição de entrada em uma área (ADR 0010): a home marca a saída aqui, com a
 * hora, e o documento da área lê a marca para abrir com a animação de chegada.
 * Fica em `sessionStorage`: vale só para a navegação seguinte, na mesma aba.
 */
export const ENTRY_STORAGE_KEY = 'portfolio:entrada';

/** Atributo do `<html>` enquanto a animação de chegada está na tela. */
export const ARRIVAL_ATTRIBUTE = 'data-arrival';

/** A marca só vale por este tempo: depois disso a navegação não foi a da transição. */
const ARRIVAL_MAX_AGE_MS = 5000;

/**
 * Script que o documento da área põe inline no `<head>`: consome a marca e, se
 * ela for recente, liga o atributo antes da primeira pintura, para a página não
 * aparecer um instante antes da cortina. Exportado como texto; este pacote não
 * executa API de navegador.
 */
export const ARRIVAL_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  ENTRY_STORAGE_KEY,
)},t=Number(sessionStorage.getItem(k));sessionStorage.removeItem(k);if(t&&${ARRIVAL_MAX_AGE_MS}>Date.now()-t)document.documentElement.setAttribute(${JSON.stringify(
  ARRIVAL_ATTRIBUTE,
)},"")}catch(e){}})()`;

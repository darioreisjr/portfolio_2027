import { scriptValue } from './inline-script.js';

/** Onde a escolha de pausa de animação fica guardada no site todo (WCAG 2.2.2, ADR 0008). */
export const MOTION_STORAGE_KEY = 'portfolio:home-animacoes';

/**
 * Script inline para sincronizar a preferência de pausa do movimento
 * em páginas com `.area-motion` (ADR 0008, issue #38).
 */
export const AREA_MOTION_INIT_SCRIPT = `(function(){try{var k=${scriptValue(
  MOTION_STORAGE_KEY,
)};var off=localStorage.getItem(k)==="off";var sync=function(){var m=document.querySelector(".area-motion input");if(!m)return;if(off)m.checked=true;m.addEventListener("change",function(){try{localStorage.setItem(k,m.checked?"off":"on")}catch(e){}})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync);else sync()}catch(e){}})()`;

import { ENTRY_STORAGE_KEY, entryMark, TRANSITION_DELAY_MS } from '@portfolio/contracts';

/**
 * Script inline da página da comunidade (ADR 0013): dá ao botão de volta a
 * transição "explosão de aura". Fica no HTML, e não em um Client Component,
 * porque a rota do Next é uma só: o código cairia no pacote que a home baixa.
 *
 * Só para um clique comum de quem não pediu menos movimento nem pausou as
 * animações; fora disso, e sem JavaScript, o link navega na hora. Devolve texto
 * e não pode conter `<`, porque vai dentro de um `<script>`.
 */
export const COMMUNITY_LEAVE_SCRIPT = `(function(){var d=document,q=function(s){return d.querySelector(s)};d.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a.c-back"),p=q(".area-motion input");if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||matchMedia("(prefers-reduced-motion: reduce)").matches||(p&&p.checked))return;e.preventDefault();try{sessionStorage.setItem(${JSON.stringify(
  ENTRY_STORAGE_KEY,
)},${JSON.stringify(entryMark('community', 0).replace(/0$/, ''))}+Date.now())}catch(x){}var c=q(".community-departure");if(c)c.hidden=false;setTimeout(function(){location.assign(a.href)},${TRANSITION_DELAY_MS})});addEventListener("pageshow",function(){var c=q(".community-departure");if(c)c.hidden=true})})()`;

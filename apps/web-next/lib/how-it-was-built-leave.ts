import {
  ENTRY_STORAGE_KEY,
  entryMarkPrefix,
  scriptValue,
  TRANSITION_DELAY_MS,
} from '@portfolio/contracts';

/**
 * Script inline da página "Como foi feito" (ADR 0013): dá ao botão de volta a
 * transição "desdobramento de blueprint". Fica no HTML, e não em um Client
 * Component, porque a rota do Next é uma só: o código cairia no pacote que a home baixa.
 *
 * Só para um clique comum de quem não pediu menos movimento nem pausou as
 * animações; fora disso, e sem JavaScript, o link navega na hora. Devolve texto
 * e vai dentro de um `<script>`: todo valor entra por `scriptValue`.
 */
export const HOW_IT_WAS_BUILT_LEAVE_SCRIPT = `(function(){var d=document,q=function(s){return d.querySelector(s)};d.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a.b-back"),p=q(".area-motion input");if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||matchMedia("(prefers-reduced-motion: reduce)").matches||(p&&p.checked))return;e.preventDefault();try{sessionStorage.setItem(${scriptValue(
  ENTRY_STORAGE_KEY,
)},${scriptValue(entryMarkPrefix('how-it-was-built'))}+Date.now())}catch(x){}var c=q(".built-departure"),s=q(".built-departure-status");if(s&&c)s.textContent=c.textContent||"";if(c)c.hidden=false;setTimeout(function(){location.assign(a.href)},${scriptValue(TRANSITION_DELAY_MS)})});addEventListener("pageshow",function(){var c=q(".built-departure"),s=q(".built-departure-status");if(c)c.hidden=true;if(s)s.textContent=""})})()`;

// Página de desenvolvimento isolado. Faz o papel do shell: carrega tokens e
// design system uma vez, e a entrada do idioma pedido em `?locale=` (padrão pt-br),
// a mesma que vai para produção. As entradas nunca importam tokens nem o design system.
import '@portfolio/tokens/tokens.css';
// A folha das páginas internas estiliza a tela "em construção" (ADR 0009).
import '@portfolio/design-system/areas.css';
import '@portfolio/design-system';

// Map, e não objeto: o valor de ?locale= nunca alcança chaves do protótipo.
const loadPtBr = () => import('../src/entries/pt-br.ts');
const entries = new Map<string, () => Promise<unknown>>([
  ['pt-br', loadPtBr],
  ['en', () => import('../src/entries/en.ts')],
  ['es', () => import('../src/entries/es.ts')],
]);
const requested = new URLSearchParams(location.search).get('locale')?.toLowerCase() ?? 'pt-br';
await (entries.get(requested) ?? loadPtBr)();

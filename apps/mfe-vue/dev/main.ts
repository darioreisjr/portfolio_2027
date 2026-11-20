// Página de desenvolvimento isolado. Faz o papel do shell: carrega tokens e
// design system uma vez, e a entrada do idioma pedido em `?locale=` (padrão pt-br),
// a mesma que vai para produção. As entradas nunca importam tokens nem o design system.
import '@portfolio/tokens/tokens.css';
// A folha das páginas internas estiliza a tela "em construção" (ADR 0009).
import '@portfolio/design-system/areas.css';
import '@portfolio/design-system';

const entries = {
  'pt-br': () => import('../src/entries/pt-br.ts'),
  en: () => import('../src/entries/en.ts'),
  es: () => import('../src/entries/es.ts'),
};
const requested = new URLSearchParams(location.search).get('locale')?.toLowerCase();
await (entries[requested as keyof typeof entries] ?? entries['pt-br'])();

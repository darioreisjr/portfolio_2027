// Página de desenvolvimento isolado. Faz o papel do shell: carrega o design
// system uma vez (os tokens entram por `styles` no angular.json) e a entrada do
// idioma pedido em `?locale=` (padrão pt-br), a mesma que vai para produção.
// As entradas nunca importam o design system.
import '@portfolio/design-system';

const entries = {
  'pt-br': () => import('../src/entries/pt-br'),
  en: () => import('../src/entries/en'),
  es: () => import('../src/entries/es'),
};
const requested = new URLSearchParams(location.search).get('locale')?.toLowerCase();
await (entries[requested as keyof typeof entries] ?? entries['pt-br'])();

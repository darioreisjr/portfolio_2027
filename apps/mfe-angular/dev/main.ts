// Página de desenvolvimento isolado. Faz o papel do shell: carrega o design
// system uma vez (os tokens entram por `styles` no angular.json) e a entrada do
// idioma pedido em `?locale=` (padrão pt-br), a mesma que vai para produção.
// As entradas nunca importam o design system.
import '@portfolio/design-system';

// Comparação explícita: o valor de ?locale= nunca vira chave nem nome de função.
const requested = new URLSearchParams(location.search).get('locale')?.toLowerCase();
if (requested === 'en') await import('../src/entries/en');
else if (requested === 'es') await import('../src/entries/es');
else await import('../src/entries/pt-br');

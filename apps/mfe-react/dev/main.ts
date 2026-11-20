// Página de desenvolvimento isolado. Faz o papel do shell: carrega tokens e
// design system uma vez, e a entrada do idioma pedido em `?locale=` (padrão pt-br),
// a mesma que vai para produção. As entradas nunca importam tokens nem o design system.
import '@portfolio/tokens/tokens.css';
// A folha das páginas internas estiliza a tela "em construção" (ADR 0009).
import '@portfolio/design-system/areas.css';
import '@portfolio/design-system';

// Comparação explícita: o valor de ?locale= nunca vira chave nem nome de função.
const requested = new URLSearchParams(location.search).get('locale')?.toLowerCase();
if (requested === 'en') await import('../src/entries/en.ts');
else if (requested === 'es') await import('../src/entries/es.ts');
else await import('../src/entries/pt-br.ts');

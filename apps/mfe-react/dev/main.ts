// Página de desenvolvimento isolado. Faz o papel do shell: carrega tokens e
// design system uma vez. O ponto de entrada do MFE (src/main.ts) nunca os importa.
import '@portfolio/tokens/tokens.css';
// A folha das páginas internas estiliza a tela "em construção" (ADR 0009).
import '@portfolio/design-system/areas.css';
import '@portfolio/design-system';
import '../src/main.ts';

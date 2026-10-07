// Página de desenvolvimento isolado. Faz o papel do shell: carrega tokens e
// design system uma vez. O ponto de entrada do MFE (src/main.ts) nunca os importa.
import '@portfolio/tokens/tokens.css';
import '@portfolio/design-system';
import '../src/main.ts';

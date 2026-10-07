// Página de desenvolvimento isolado. Faz o papel do shell: carrega o design
// system uma vez (os tokens entram por `styles` no angular.json). O ponto de
// entrada do MFE (src/main.ts) nunca os importa.
import '@portfolio/design-system';
import '../src/main';

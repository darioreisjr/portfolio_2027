// Gera dist/tokens.css e a lista tipada de nomes de token.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { component, primitives, semantic, semanticStatic } from '../src/tokens.mjs';

const outDir = fileURLToPath(new URL('../dist', import.meta.url));

// Fonte do site: M PLUS Rounded 1c, só o subconjunto latino, nos dois pesos que
// o site usa. Os arquivos vêm do pacote @fontsource e são publicados em
// /_ds/fonts/, o mesmo endereço para o shell e para o Next.js (ADR 0006).
const FONT_FAMILY = 'M PLUS Rounded 1c';
const FONT_WEIGHTS = [400, 700];
const FONT_SOURCE = new URL(
  '../node_modules/@fontsource/m-plus-rounded-1c/files/',
  import.meta.url,
);
const fontFile = (weight) => `m-plus-rounded-1c-latin-${weight}-normal.woff2`;
// Largura da fonte em relação à Arial, medida no navegador com as frases do
// site: 1,04 no peso 400 e 1,01 no 700. Com o ajuste, a fonte de reserva ocupa
// quase o mesmo espaço e o texto não muda de quebra quando a fonte chega.
const FALLBACK_ADJUST = '103%';

const fontFaces = [
  ...FONT_WEIGHTS.map(
    (weight) => `@font-face {
  font-family: '${FONT_FAMILY}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('/_ds/fonts/${fontFile(weight)}') format('woff2');
}`,
  ),
  `@font-face {
  font-family: '${FONT_FAMILY} Fallback';
  src: local('Arial'), local('Helvetica Neue'), local('Roboto'), local('Liberation Sans');
  size-adjust: ${FALLBACK_ADJUST};
}`,
].join('\n\n');

const declarations = (tokens, indent = '  ') =>
  Object.entries(tokens)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join('\n');

const css = `/* GERADO por packages/tokens/scripts/build.mjs. Edite src/tokens.mjs. */

${fontFaces}

:root {
  color-scheme: light;
${declarations(primitives)}
${declarations(semanticStatic)}
${declarations(semantic.light)}
${declarations(component)}
}

/* Sem escolha salva, vale a preferência do sistema. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
${declarations(semantic.dark, '    ')}
  }
}

:root[data-theme='dark'] {
  color-scheme: dark;
${declarations(semantic.dark)}
}

body {
  margin: 0;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-size-md);
  line-height: var(--text-line-height);
}

/* Antes do upgrade, o componente já ocupa o espaço e tem a aparência final. */
ds-badge:not(:defined) {
  display: inline-block;
  padding: var(--ds-badge-padding-block) var(--ds-badge-padding-inline);
  border-radius: var(--ds-badge-radius);
  background: var(--ds-badge-bg);
  color: var(--ds-badge-text);
  font-size: var(--ds-badge-font-size);
  font-weight: var(--text-weight-strong);
  line-height: var(--text-line-height);
}

/* Só funciona com JavaScript: fica oculto até o upgrade, com o espaço reservado (ADR 0005). */
ds-theme-toggle:not(:defined) {
  display: inline-block;
  inline-size: var(--ds-theme-toggle-size);
  block-size: var(--ds-theme-toggle-size);
  visibility: hidden;
}

/* Grupo fixo no canto inferior direito de todo documento. Sem custom element:
   a marcação é do dono do documento e a aparência é esta (ADR 0006). */
.ds-dock {
  position: fixed;
  inset-block-end: var(--ds-dock-offset-block);
  inset-inline-end: var(--ds-dock-offset-inline);
  z-index: 1;
  display: flex;
  align-items: center;
}

/* Seletor de idioma: um <details>. Fechado, mostra só a bandeira do idioma em
   uso; aberto, os outros três sobem em coluna. Sem JavaScript (ADR 0006). */
.ds-language-switcher {
  position: relative;
}

.ds-language-switcher summary {
  list-style: none;
  cursor: pointer;
}

.ds-language-switcher summary::-webkit-details-marker {
  display: none;
}

.ds-language-switcher ul {
  position: absolute;
  inset-block-end: 100%;
  inset-inline-end: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 0;
  margin: 0;
  padding: 0;
  border-radius: var(--radius-full);
  background: var(--ds-language-switcher-edge);
  list-style: none;
}

/* O alvo de toque é maior que a bandeira. */
.ds-language-switcher summary,
.ds-language-switcher a {
  display: grid;
  place-items: center;
  inline-size: var(--ds-language-switcher-size);
  block-size: var(--ds-language-switcher-size);
  border-radius: var(--radius-full);
}

.ds-language-switcher summary:focus-visible,
.ds-language-switcher a:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: calc(var(--focus-ring-width) * -1);
}

.ds-language-switcher img {
  display: block;
  inline-size: var(--ds-language-switcher-flag-size);
  block-size: var(--ds-language-switcher-flag-size);
  border-radius: var(--radius-full);
  object-fit: cover;
  outline: var(--ds-language-switcher-ring-width) solid var(--ds-language-switcher-edge);
}

/* Idioma em uso: um segundo anel, afastado da bandeira. Não depende só de cor. */
.ds-language-switcher summary img {
  outline-color: var(--ds-language-switcher-current);
  outline-offset: var(--ds-language-switcher-ring-width);
}

/* Pequeno pulo de quem está sob o ponteiro, nos controles do grupo do canto.
   Anima a imagem, não o alvo: a área de clique não se mexe. */
@keyframes ds-hop {
  40% {
    translate: 0 calc(var(--space-block-xs) * -1);
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .ds-language-switcher :is(summary, a):hover img {
    animation: ds-hop calc(var(--motion-duration-md) * 2) var(--motion-ease-out);
  }
}
`;

const publicNames = [
  ...Object.keys(semanticStatic),
  ...Object.keys(semantic.light),
  ...Object.keys(component),
];

mkdirSync(`${outDir}/fonts`, { recursive: true });
for (const weight of FONT_WEIGHTS) {
  copyFileSync(new URL(fontFile(weight), FONT_SOURCE), `${outDir}/fonts/${fontFile(weight)}`);
}
writeFileSync(`${outDir}/tokens.css`, css);
writeFileSync(
  `${outDir}/index.js`,
  `export const tokenNames = ${JSON.stringify(publicNames, null, 2)};\n`,
);
writeFileSync(
  `${outDir}/index.d.ts`,
  [
    '/** Tokens semânticos e de componente: os únicos que apps e componentes usam. */',
    `export type TokenName =\n${publicNames.map((name) => `  | '${name}'`).join('\n')};`,
    'export declare const tokenNames: readonly TokenName[];',
    '',
  ].join('\n'),
);

console.log(`Tokens gerados: ${publicNames.length} públicos.`);

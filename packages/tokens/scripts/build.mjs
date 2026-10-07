// Gera dist/tokens.css e a lista tipada de nomes de token.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { component, primitives, semantic, semanticStatic } from '../src/tokens.mjs';

const outDir = fileURLToPath(new URL('../dist', import.meta.url));

const declarations = (tokens, indent = '  ') =>
  Object.entries(tokens)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join('\n');

const css = `/* GERADO por packages/tokens/scripts/build.mjs. Edite src/tokens.mjs. */

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

.ds-language-switcher ul {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* O alvo de toque é maior que a bandeira. */
.ds-language-switcher a {
  display: grid;
  place-items: center;
  inline-size: var(--ds-language-switcher-size);
  block-size: var(--ds-language-switcher-size);
  border-radius: var(--radius-full);
}

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
.ds-language-switcher a[aria-current='page'] img {
  outline-color: var(--ds-language-switcher-current);
  outline-offset: var(--ds-language-switcher-ring-width);
}
`;

const publicNames = [
  ...Object.keys(semanticStatic),
  ...Object.keys(semantic.light),
  ...Object.keys(component),
];

mkdirSync(outDir, { recursive: true });
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

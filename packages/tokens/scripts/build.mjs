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

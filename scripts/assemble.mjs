#!/usr/bin/env node
// Junta as saídas de build dos apps em dist/, o diretório único que é publicado
// (ADR 0004). Falha se dois apps emitirem o mesmo caminho.
//
//   node scripts/assemble.mjs
//
// Rode depois de `pnpm build`.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Uma bandeira por idioma (ADR 0006).
const FLAGS = ['pt-BR', 'en', 'es', 'pt-PT'];
// Os dois pesos da fonte do site, só no alfabeto latino.
const FONTS = [400, 700].map((weight) => `fonts/m-plus-rounded-1c-latin-${weight}-normal.woff2`);

/**
 * `only` limita a cópia a alguns arquivos da origem.
 * `flattenNextSegments` corrige os arquivos de pré-carga do Next.js (ver abaixo).
 */
export const sources = [
  { from: 'apps/web-next/out', to: '', flattenNextSegments: true },
  { from: 'apps/shell/dist', to: '' },
  { from: 'apps/mfe-vue/dist', to: '_mfe/vue' },
  { from: 'apps/mfe-react/dist', to: '_mfe/react' },
  { from: 'apps/mfe-angular/dist/browser', to: '_mfe/angular' },
  {
    from: 'packages/design-system/dist',
    to: '_ds',
    only: ['ds.js', ...FLAGS.map((flag) => `flags/${flag}.svg`)],
  },
  { from: 'packages/tokens/dist', to: '_ds', only: ['tokens.css', ...FONTS] },
];

const REQUIRED = [
  'index.html',
  '404.html',
  '_shell/shell.js',
  '_ds/ds.js',
  '_ds/tokens.css',
  ...FLAGS.map((flag) => `_ds/flags/${flag}.svg`),
  ...FONTS.map((font) => `_ds/${font}`),
];

function walk(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(join(dir, entry.name), relative) : [relative];
  });
}

/**
 * O export do Next.js 16.3.8, no Windows, grava a pré-carga de segmento como
 * `rota/__next.a/b.txt`, mas o cliente pede `rota/__next.a.b.txt` e recebe 404.
 * Publicamos com o nome que o cliente pede. Não verificado se o export em Linux
 * já sai com ponto; nesse caso nada casa aqui e a função não muda nada.
 */
export function flattenNextSegment(file) {
  const parts = file.split('/');
  const start = parts.findIndex((part) => part.startsWith('__next.'));
  if (start === -1 || start === parts.length - 1) return file;
  return [...parts.slice(0, start), parts.slice(start).join('.')].join('/');
}

/** Caminho publicado -> arquivo de origem. Lança erro em origem ausente ou colisão. */
export function planAssembly(root, sourceList = sources) {
  const plan = new Map();
  const collisions = [];

  for (const source of sourceList) {
    const fromDir = join(root, source.from);
    if (!existsSync(fromDir)) {
      throw new Error(`Saída de build ausente: ${source.from}. Rode "pnpm build" antes.`);
    }
    const files = source.only ?? walk(fromDir);
    for (const file of files) {
      const name = source.flattenNextSegments ? flattenNextSegment(file) : file;
      const published = source.to ? `${source.to}/${name}` : name;
      const origin = `${source.from}/${file}`;
      if (plan.has(published)) collisions.push(`${published}: ${plan.get(published)} e ${origin}`);
      else plan.set(published, origin);
    }
  }

  if (collisions.length > 0) {
    throw new Error(`Dois apps emitem o mesmo caminho:\n- ${collisions.join('\n- ')}`);
  }
  return plan;
}

export function assemble(root, outDir = join(root, 'dist')) {
  const plan = planAssembly(root);
  const missing = REQUIRED.filter((file) => !plan.has(file));
  if (missing.length > 0) throw new Error(`Arquivos obrigatórios ausentes: ${missing.join(', ')}`);

  rmSync(outDir, { recursive: true, force: true });
  for (const [published, origin] of plan) {
    const target = join(outDir, published);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(root, origin), target);
  }
  return plan.size;
}

if (import.meta.main) {
  try {
    console.log(`dist/ montado com ${assemble(repoRoot)} arquivos.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

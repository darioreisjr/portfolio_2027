#!/usr/bin/env node
// Teste de fumaça depois do deploy (ADR 0014): confere, no endereço publicado,
// que cada página do dist/ responde e que o ambiente está visível ou escondido
// dos buscadores como deveria.
//
//   node scripts/smoke.mjs https://2027.darioreis.dev --indexable
//   node scripts/smoke.mjs https://develop.darioreis.dev --noindex
//
// As páginas vêm do próprio dist/: todo `index.html` é um endereço.

import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Caminhos publicados de um diretório: `/`, `/recrutador/`, `/en/tech/`... */
export function pagesIn(distDir) {
  return readdirSync(distDir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name === 'index.html')
    .map((entry) => {
      const folder = entry.parentPath.slice(distDir.length).replaceAll('\\', '/');
      return `${folder}/`.replace(/^\/?/, '/');
    })
    .filter((path) => !path.startsWith('/_'))
    .sort();
}

/**
 * Confere uma resposta. `expectIndexable` diz se o ambiente pode ir para os
 * buscadores: a produção não leva `X-Robots-Tag`; todo o resto leva `noindex`.
 */
export function problemsOf({ path, status, robots, body }, expectIndexable) {
  const problems = [];
  if (status !== 200) problems.push(`${path}: respondeu ${status}`);
  else if (!/<html[\s>]/i.test(body)) problems.push(`${path}: a resposta não é uma página HTML`);
  const hidden = /noindex/i.test(robots ?? '');
  if (expectIndexable && hidden) problems.push(`${path}: produção com X-Robots-Tag: noindex`);
  if (!expectIndexable && !hidden) problems.push(`${path}: sem X-Robots-Tag: noindex`);
  return problems;
}

async function main() {
  const [origin, mode] = process.argv.slice(2);
  if (!origin || !['--indexable', '--noindex'].includes(mode)) {
    throw new Error('Uso: node scripts/smoke.mjs <https://endereço> --indexable|--noindex');
  }
  const distDir = join(repoRoot, 'dist');
  if (!existsSync(distDir)) throw new Error('dist/ não existe: nada para conferir.');

  const pages = pagesIn(distDir);
  const problems = [];
  for (const path of pages) {
    const response = await fetch(new URL(path, origin), { redirect: 'follow' });
    problems.push(
      ...problemsOf(
        {
          path,
          status: response.status,
          robots: response.headers.get('x-robots-tag'),
          body: await response.text(),
        },
        mode === '--indexable',
      ),
    );
  }
  // Endereço que não existe continua não existindo.
  const missing = await fetch(new URL('/pagina-que-nao-existe/', origin));
  if (missing.status !== 404) {
    problems.push(`/pagina-que-nao-existe/: respondeu ${missing.status}, e não 404`);
  }

  if (problems.length > 0)
    throw new Error(`Fumaça em ${origin} falhou:\n- ${problems.join('\n- ')}`);
  console.log(`Fumaça em ${origin}: ${pages.length} páginas respondem, ${mode.slice(2)}.`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

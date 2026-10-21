#!/usr/bin/env node
// Cobra os tetos de JavaScript de docs/quality/budgets.json sobre o dist/ montado.
// O Lighthouse não mede "JavaScript por parte" (shell, design system, cada MFE),
// então este script é o portão desses limites.
//
//   node scripts/check-budgets.mjs

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { findRoute, locales, mfeScript, routes } from '../packages/contracts/dist/index.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');

export const gzipKb = (file) => gzipSync(readFileSync(file)).length / 1000;

export function scriptsIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Extrai scripts do HTML ignorando nomodule, com filtro opcional de prefixo. */
export function extractHtmlScripts(html, prefix = '') {
  return [...html.matchAll(/<script[^>]+src="(\/[^"]+\.js)"[^>]*>/g)]
    .filter((match) => !/\snomodule/i.test(match[0]))
    .map((match) => match[1])
    .filter((src) => !prefix || src.startsWith(prefix));
}

/**
 * Coleta recursivamente todos os arquivos JavaScript importados a partir de um módulo de entrada.
 */
export function collectModuleDependencies(distDir, entryRelPath) {
  const visited = new Set();
  const queue = [entryRelPath.replace(/\\/g, '/')];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    const absPath = join(distDir, current);
    if (!existsSync(absPath)) continue;
    visited.add(current);

    const code = readFileSync(absPath, 'utf8');
    const importMatches = [
      ...code.matchAll(/(?:import|export)\s+(?:.+?\s+from\s+)?['"](\.[^'"]+)['"]/g),
    ];
    for (const match of importMatches) {
      const relPath = match[1];
      const resolved = normalize(join(dirname(current), relPath)).replace(/\\/g, '/');
      if (!visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return [...visited];
}

/** Mede o tamanho em kB (gzip) de uma parte (MFE, shell, design system ou Next.js). */
export function partSize(distDir, name, config) {
  if (config.dir === '_next' || name === 'web-next') {
    // Next.js: mede os scripts da página gerados pelo Next.js (sem design system nem nomodule).
    const nextRoutes = ['/', '/comunidade/', '/como-foi-feito/'];
    let max = 0;
    for (const route of nextRoutes) {
      const htmlFile = join(distDir, route, 'index.html');
      if (!existsSync(htmlFile)) continue;
      const html = readFileSync(htmlFile, 'utf8');
      const scripts = extractHtmlScripts(html, '/_next/');
      const size = [...new Set(scripts)].reduce((sum, src) => sum + gzipKb(join(distDir, src)), 0);
      if (size > max) max = size;
    }
    return max;
  }

  // Microfrontends com scripts separados por idioma ([locale]): mede o maior idioma transferido.
  const mfeRoute = routes.find(
    (r) =>
      r.owner === 'shell' &&
      r.mfe?.script.includes('[locale]') &&
      `_mfe/${r.framework.toLowerCase()}` === config.dir.toLowerCase().replace(/\\/g, '/'),
  );
  if (mfeRoute?.mfe) {
    let max = 0;
    for (const locale of locales) {
      const script = mfeScript(mfeRoute.mfe, locale);
      const scriptRel = script.startsWith('/') ? script.slice(1) : script;
      const deps = collectModuleDependencies(distDir, scriptRel);
      const size = deps.reduce((sum, file) => sum + gzipKb(join(distDir, file)), 0);
      if (size > max) max = size;
    }
    return max;
  }

  return scriptsIn(join(distDir, config.dir)).reduce((sum, file) => sum + gzipKb(file), 0);
}

/** Mede o total de JavaScript de uma rota no dist/. */
export function routeSize(distDir, route) {
  const html = readFileSync(join(distDir, route, 'index.html'), 'utf8');
  const fromHtml = extractHtmlScripts(html);
  let total = [...new Set(fromHtml)].reduce((sum, src) => sum + gzipKb(join(distDir, src)), 0);

  const match = findRoute(route);
  const mfe = match?.entry.mfe;
  if (mfe) {
    if (mfe.script.includes('[locale]')) {
      const script = mfeScript(mfe, match.locale);
      const scriptRel = script.startsWith('/') ? script.slice(1) : script;
      const deps = collectModuleDependencies(distDir, scriptRel);
      total += deps.reduce((sum, file) => sum + gzipKb(join(distDir, file)), 0);
    } else {
      total += scriptsIn(join(distDir, dirname(mfe.script))).reduce(
        (sum, file) => sum + gzipKb(file),
        0,
      );
    }
  }
  return total;
}

export function runBudgetChecks(distDir, budgets) {
  const failures = [];
  const rows = [];
  const check = (label, sizeKb, maxKb) => {
    rows.push({ medido: label, 'kB (gzip)': sizeKb.toFixed(1), teto: maxKb, ok: sizeKb <= maxKb });
    if (sizeKb > maxKb)
      failures.push(`${label}: ${sizeKb.toFixed(1)} kB passa do teto de ${maxKb} kB`);
  };

  for (const [name, config] of Object.entries(budgets.parts)) {
    check(`parte ${name}`, partSize(distDir, name, config), config.maxKb);
  }

  for (const [route, maxKb] of Object.entries(budgets.routes)) {
    check(`rota ${route}`, routeSize(distDir, route), maxKb);
  }

  for (const file of scriptsIn(join(distDir, '_mfe'))) {
    if (readFileSync(file, 'utf8').includes('lit$')) {
      failures.push(
        `${file.slice(distDir.length + 1)}: contém o Lit; MFEs não empacotam o design system`,
      );
    }
  }

  return { failures, rows };
}

function main() {
  if (!existsSync(distDir)) {
    console.error('dist/ não existe. Rode "pnpm build && pnpm assemble" antes.');
    process.exit(1);
  }

  const budgets = JSON.parse(readFileSync(join(repoRoot, 'docs/quality/budgets.json'), 'utf8'));
  const xray = JSON.parse(readFileSync(join(repoRoot, 'packages/content/data/site.json'), 'utf8'));
  const baseline = new Map([
    ...xray.parts.map((part) => [`parte ${part.name}`, part.jsKb]),
    ...xray.areas.map((area) => [`rota ${area.path}`, area.jsKb]),
  ]);

  const { failures, rows } = runBudgetChecks(distDir, budgets);

  console.table(rows);

  if (process.env.BUDGETS_SUMMARY) {
    const delta = (row) => {
      const before = baseline.get(row.medido);
      if (before === undefined) return 'novo';
      const change = Number(row['kB (gzip)']) - before;
      return Math.abs(change) < 0.05
        ? '='
        : `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}`;
    };
    const lines = [
      '| Medido | kB (gzip) | Mudou | Teto | |',
      '| --- | ---: | ---: | ---: | --- |',
      ...rows.map(
        (row) =>
          `| ${row.medido} | ${row['kB (gzip)']} | ${delta(row)} | ${row.teto} | ${row.ok ? '✅' : '❌'} |`,
      ),
      '',
      `"Mudou" compara com o raio-x versionado, medido em ${xray.measuredAt}.`,
    ];
    writeFileSync(process.env.BUDGETS_SUMMARY, `${lines.join('\n')}\n`);
  }

  if (failures.length > 0) {
    console.error(`\nOrçamento estourado:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }
  console.log('Orçamentos de JavaScript respeitados.');
}

if (import.meta.main) {
  main();
}

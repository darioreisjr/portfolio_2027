#!/usr/bin/env node
// Cobra os tetos de JavaScript de docs/quality/budgets.json sobre o dist/ montado.
// O Lighthouse não mede "JavaScript por parte" (shell, design system, cada MFE),
// então este script é o portão desses limites.
//
//   node scripts/check-budgets.mjs

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { findRoute } from '../packages/contracts/dist/index.js';

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
  return scriptsIn(join(distDir, config.dir)).reduce((sum, file) => sum + gzipKb(file), 0);
}

/** Mede o total de JavaScript de uma rota no dist/. */
export function routeSize(distDir, route) {
  const html = readFileSync(join(distDir, route, 'index.html'), 'utf8');
  const fromHtml = extractHtmlScripts(html);
  let total = [...new Set(fromHtml)].reduce((sum, src) => sum + gzipKb(join(distDir, src)), 0);

  const mfeScript = findRoute(route)?.entry.mfe?.script;
  if (mfeScript) {
    total += scriptsIn(join(distDir, dirname(mfeScript))).reduce(
      (sum, file) => sum + gzipKb(file),
      0,
    );
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

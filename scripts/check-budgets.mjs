#!/usr/bin/env node
// Cobra os tetos de JavaScript de docs/quality/budgets.json sobre o dist/ montado.
// O Lighthouse não mede "JavaScript por parte" (shell, design system, cada MFE),
// então este script é o portão desses limites.
//
//   node scripts/check-budgets.mjs

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { findRoute } from '../packages/contracts/dist/index.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const budgets = JSON.parse(readFileSync(join(repoRoot, 'docs/quality/budgets.json'), 'utf8'));

if (!existsSync(distDir)) {
  console.error('dist/ não existe. Rode "pnpm build && pnpm assemble" antes.');
  process.exit(1);
}

const gzipKb = (file) => gzipSync(readFileSync(file)).length / 1000;

function scriptsIn(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name));
}

const partSize = (dir) =>
  scriptsIn(join(distDir, dir)).reduce((sum, file) => sum + gzipKb(file), 0);

const failures = [];
const rows = [];
const check = (label, sizeKb, maxKb) => {
  rows.push({ medido: label, 'kB (gzip)': sizeKb.toFixed(1), teto: maxKb, ok: sizeKb <= maxKb });
  if (sizeKb > maxKb)
    failures.push(`${label}: ${sizeKb.toFixed(1)} kB passa do teto de ${maxKb} kB`);
};

for (const [name, { dir, maxKb }] of Object.entries(budgets.parts)) {
  check(`parte ${name}`, partSize(dir), maxKb);
}

// JavaScript de uma rota: os scripts do HTML dela e, nas áreas do shell, o MFE.
for (const [route, maxKb] of Object.entries(budgets.routes)) {
  const html = readFileSync(join(distDir, route, 'index.html'), 'utf8');
  // Scripts `nomodule` são polyfills que navegadores atuais não baixam.
  const fromHtml = [...html.matchAll(/<script[^>]+src="(\/[^"]+\.js)"[^>]*>/g)]
    .filter((match) => !/\snomodule/i.test(match[0]))
    .map((match) => match[1]);
  let total = [...new Set(fromHtml)].reduce((sum, src) => sum + gzipKb(join(distDir, src)), 0);

  const mfeScript = findRoute(route)?.entry.mfe?.script;
  if (mfeScript) total += partSize(dirname(mfeScript));

  check(`rota ${route}`, total, maxKb);
}

// Regra 6 do AGENTS.md: MFEs não empacotam o Lit nem o design system.
for (const file of scriptsIn(join(distDir, '_mfe'))) {
  if (readFileSync(file, 'utf8').includes('lit$')) {
    failures.push(
      `${file.slice(distDir.length + 1)}: contém o Lit; MFEs não empacotam o design system`,
    );
  }
}

console.table(rows);
if (failures.length > 0) {
  console.error(`\nOrçamento estourado:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Orçamentos de JavaScript respeitados.');

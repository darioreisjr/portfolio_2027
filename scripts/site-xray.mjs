#!/usr/bin/env node
// Grava o "raio-x" do próprio site em packages/content/data/site.json: as áreas
// e a tecnologia de cada uma, o JavaScript medido contra o teto, o Lighthouse e
// a lista de decisões (ADRs). É dado real do repositório, não sobre o autor nem
// de exemplo, e fica versionado porque as medições só existem depois do build
// de todos os apps (ADR 0012).
//
//   pnpm build && pnpm assemble && pnpm lhci   (o lhci é opcional)
//   node scripts/site-xray.mjs            grava o arquivo
//   node scripts/site-xray.mjs --check    confere o que não depende de medição

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { routes } from '../packages/contracts/dist/index.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const target = join(repoRoot, 'packages/content/data/site.json');
const budgets = JSON.parse(readFileSync(join(repoRoot, 'docs/quality/budgets.json'), 'utf8'));
// O endereço do repositório vem do package.json da raiz.
const repository = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).repository.url;

/** Uma casa decimal, como em docs/quality/budgets.md. */
const round = (value) => Math.round(value * 10) / 10;
const gzipKb = (file) => gzipSync(readFileSync(file)).length / 1000;
const scriptsIn = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name));
const partKb = (dir) => scriptsIn(join(distDir, dir)).reduce((sum, file) => sum + gzipKb(file), 0);

/** O JavaScript de uma rota, medido como em check-budgets.mjs. */
function routeKb(entry) {
  const path = entry.paths['pt-BR'];
  const html = readFileSync(join(distDir, path, 'index.html'), 'utf8');
  const fromHtml = [...html.matchAll(/<script[^>]+src="(\/[^"]+\.js)"[^>]*>/g)]
    .filter((match) => !/\snomodule/i.test(match[0]))
    .map((match) => match[1]);
  let total = [...new Set(fromHtml)].reduce((sum, src) => sum + gzipKb(join(distDir, src)), 0);
  if (entry.mfe) total += partKb(dirname(entry.mfe.script));
  return total;
}

/** Mediana do Lighthouse por rota, se houver relatórios de `pnpm lhci`. */
function lighthouse() {
  const dir = join(repoRoot, '.lighthouseci');
  if (!existsSync(dir)) return {};
  const runs = {};
  for (const file of readdirSync(dir).filter((name) => /^lhr-.*\.json$/.test(name))) {
    const report = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const path = new URL(report.finalDisplayedUrl).pathname;
    (runs[path] ??= []).push({
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      lcpMs: Math.round(report.audits['largest-contentful-paint'].numericValue),
    });
  }
  const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  return Object.fromEntries(
    Object.entries(runs).map(([path, list]) => [
      path,
      {
        performance: median(list.map((run) => run.performance)),
        accessibility: median(list.map((run) => run.accessibility)),
        lcpMs: median(list.map((run) => run.lcpMs)),
      },
    ]),
  );
}

/** Número, título e situação de cada ADR, lidos do cabeçalho do arquivo. */
function decisions() {
  const dir = join(repoRoot, 'docs/architecture/adr');
  return readdirSync(dir)
    .filter((name) => /^\d{4}-.*\.md$/.test(name))
    .sort()
    .map((name) => {
      const text = readFileSync(join(dir, name), 'utf8');
      const title = /^# ADR \d+: (.+)$/m.exec(text)?.[1];
      const status = /^- Status: \*\*([a-zçãí]+)/m.exec(text)?.[1];
      if (!title || !status) throw new Error(`Cabeçalho de ADR fora do padrão: ${name}`);
      return { number: Number(name.slice(0, 4)), title, status };
    });
}

/** O que não depende de medição: áreas, tetos e decisões. */
function structure() {
  return {
    repository,
    areas: routes.map((entry) => ({
      area: entry.area,
      framework: entry.framework,
      owner: entry.owner,
      path: entry.paths['pt-BR'],
      maxKb: budgets.routes[entry.paths['pt-BR']],
    })),
    parts: Object.entries(budgets.parts).map(([name, { maxKb }]) => ({ name, maxKb })),
    decisions: decisions(),
  };
}

const strip = (site) => ({
  repository: site.repository,
  areas: site.areas.map(({ area, framework, owner, path, maxKb }) => ({
    area,
    framework,
    owner,
    path,
    maxKb,
  })),
  parts: site.parts.map(({ name, maxKb }) => ({ name, maxKb })),
  decisions: site.decisions,
});

if (process.argv.includes('--check')) {
  const stored = JSON.parse(readFileSync(target, 'utf8'));
  if (JSON.stringify(strip(stored)) !== JSON.stringify(structure())) {
    console.error(
      'packages/content/data/site.json está diferente do repositório (áreas, tetos ou ADRs).\n' +
        'Rode: pnpm build && pnpm assemble && node scripts/site-xray.mjs',
    );
    process.exit(1);
  }
  console.log('Raio-x do site em dia com áreas, tetos e ADRs.');
} else {
  if (!existsSync(distDir)) {
    console.error('dist/ não existe. Rode "pnpm build && pnpm assemble" antes.');
    process.exit(1);
  }
  const base = structure();
  const scores = lighthouse();
  const site = {
    measuredAt: new Date().toISOString().slice(0, 10),
    repository: base.repository,
    areas: base.areas.map((area) => ({
      ...area,
      jsKb: round(routeKb(routes.find((entry) => entry.area === area.area))),
      ...scores[area.path],
    })),
    parts: base.parts.map((part) => ({
      ...part,
      jsKb: round(partKb(budgets.parts[part.name].dir)),
    })),
    decisions: base.decisions,
  };
  writeFileSync(target, `${JSON.stringify(site, null, 2)}\n`);
  const measured = Object.keys(scores).length;
  console.log(
    `Raio-x gravado: ${site.areas.length} áreas, ${site.decisions.length} ADRs, Lighthouse de ${measured} rotas.`,
  );
}

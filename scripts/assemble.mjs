#!/usr/bin/env node
// Junta as saídas de build dos apps em dist/, o diretório único que é publicado
// (ADR 0004 e ADR 0007). Falha se dois apps emitirem o mesmo caminho.
//
//   node scripts/assemble.mjs
//
// Rode depois de `pnpm build`.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalUrl,
  hreflangAlternates,
  locales,
  PRODUCTION_HOST,
  PRODUCTION_ORIGIN,
  routes,
} from '../packages/contracts/src/routes.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Folha de estilo das páginas internas; a home não a carrega (ADR 0009).
const AREAS_CSS = 'areas.css';
// Uma bandeira por idioma (ADR 0006).
const FLAGS = ['pt-BR', 'en', 'es'];
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
    only: ['ds.js', AREAS_CSS, ...FLAGS.map((flag) => `flags/${flag}.svg`)],
  },
  { from: 'packages/tokens/dist', to: '_ds', only: ['tokens.css', ...FONTS] },
];

const REQUIRED = [
  'index.html',
  '404.html',
  '_home/og-image.png',
  '_shell/shell.js',
  '_ds/ds.js',
  '_ds/tokens.css',
  `_ds/${AREAS_CSS}`,
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

/**
 * O endereço da produção (ADR 0014). Reexportado de packages/contracts.
 */
export { PRODUCTION_HOST, PRODUCTION_ORIGIN };

/**
 * Constrói o sitemap.xml com as 18 páginas (6 áreas × 3 idiomas) e os links
 * alternate de idioma e x-default (ADR 0014, issue #10).
 */
export function buildSitemap(routesList = routes) {
  const urls = [];
  for (const route of routesList) {
    for (const locale of locales) {
      const loc = canonicalUrl(route.area, locale);
      const links = hreflangAlternates(route.area)
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`,
        )
        .join('\n');
      urls.push(`  <url>\n    <loc>${loc}</loc>\n${links}\n  </url>`);
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls.join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Constrói o robots.txt apontando para o sitemap de produção (ADR 0014, issue #10).
 */
export function buildRobotsTxt() {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${PRODUCTION_ORIGIN}/sitemap.xml`, ''].join(
    '\n',
  );
}

/**
 * Constrói a configuração da Vercel (ADR 0007) com base na tabela canônica de rotas.
 * Mapeia sub-rotas dos microfrontends geridos pelo shell para seus respectivos index.html
 * e define cabeçalhos de cache agressivos para assets imutáveis e revalidação para HTML.
 */
/**
 * Extrai os hashes sha256 dos scripts inline executáveis de um conteúdo HTML.
 * Ignora scripts externos (com src) e blocos de dados JSON-LD (type="application/ld+json").
 */
export function extractInlineScriptHashes(html) {
  const matches = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)];
  const hashes = new Set();
  for (const m of matches) {
    const attrs = m[1];
    const code = m[2];
    if (attrs.includes('application/ld+json')) continue;
    const hash = createHash('sha256').update(code, 'utf8').digest('base64');
    hashes.add(`'sha256-${hash}'`);
  }
  return [...hashes].sort();
}

/**
 * Monta a diretiva Content-Security-Policy com base nos hashes dos scripts inline.
 * script-src permite apenas 'self' e os hashes específicos, sem 'unsafe-inline'.
 */
export function buildCspPolicy(scriptHashes = []) {
  const scriptSources = ["'self'", ...scriptHashes].join(' ');
  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
}

/**
 * Varre todos os arquivos .html em um diretório e extrai a união ordenada de todos
 * os hashes sha256 de scripts inline executáveis.
 */
export function collectDirectoryScriptHashes(dir) {
  const files = walk(dir);
  const hashes = new Set();
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const content = readFileSync(join(dir, file), 'utf8');
    for (const h of extractInlineScriptHashes(content)) {
      hashes.add(h);
    }
  }
  return [...hashes].sort();
}

/** Cabeçalhos de segurança básicos de toda resposta. */
export const BASE_SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** Mantido para retrocompatibilidade em testes e imports diretos. */
export const SECURITY_HEADERS = BASE_SECURITY_HEADERS;

/**
 * Constrói os cabeçalhos de segurança de toda resposta, incluindo a CSP
 * calculada a partir dos hashes de scripts inline (issue #47).
 */
export function buildSecurityHeaders(scriptHashes = []) {
  if (scriptHashes.length === 0) return SECURITY_HEADERS;
  return [
    ...BASE_SECURITY_HEADERS,
    { key: 'Content-Security-Policy', value: buildCspPolicy(scriptHashes) },
  ];
}

export function buildVercelConfig(routesList = routes, scriptHashes = []) {
  const shellRoutes = routesList.filter((route) => route.owner === 'shell');
  const rewrites = [];

  for (const route of shellRoutes) {
    for (const locale of Object.keys(route.paths)) {
      const p = route.paths[locale];
      const base = p.replace(/\/$/, '');
      rewrites.push({
        source: `${base}/:path*`,
        destination: `${base}/index.html`,
      });
    }
  }

  const securityHeaders = buildSecurityHeaders(scriptHashes);

  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    cleanUrls: true,
    trailingSlash: true,
    rewrites,
    headers: [
      // Em toda resposta (issue #46 e #47): proteção contra clickjacking,
      // MIME sniffing, vazamento de referrer, APIs de sensores e execução
      // indevida de scripts (CSP com hashes dos scripts inline compilados).
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/(.*)',
        missing: [{ type: 'host', value: PRODUCTION_HOST }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fontes e bandeiras não têm versão no nome: sem immutable, para
      // alterações chegarem a quem já visitou (issue #41).
      {
        source: '/_ds/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/_ds/flags/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // O nome do arquivo de áudio leva a versão: trocar a faixa é trocar o nome.
      {
        source: '/_home/audio/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Os bundles dos microfrontends têm nome fixo (`mfe.js`, `main.js`): com
      // cache imutável, quem já visitou ficaria com o código antigo depois de
      // cada deploy. Revalidam como o HTML; a resposta sem mudança é um 304.
      {
        source: '/_mfe/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)\\.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ],
  };
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

  const scriptHashes = collectDirectoryScriptHashes(outDir);
  const vercelConfig = buildVercelConfig(routes, scriptHashes);
  writeFileSync(join(outDir, 'vercel.json'), `${JSON.stringify(vercelConfig, null, 2)}\n`);

  writeFileSync(join(outDir, 'sitemap.xml'), buildSitemap());
  writeFileSync(join(outDir, 'robots.txt'), buildRobotsTxt());

  return plan.size + 3;
}

if (import.meta.main) {
  try {
    console.log(`dist/ montado com ${assemble(repoRoot)} arquivos.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

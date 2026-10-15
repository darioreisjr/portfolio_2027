import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import {
  buildRobotsTxt,
  buildSitemap,
  buildVercelConfig,
  flattenNextSegment,
  planAssembly,
  PRODUCTION_HOST,
  SECURITY_HEADERS,
} from './assemble.mjs';

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'assemble-'));
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), '');
  }
  return root;
}

test('mapeia cada origem para o caminho publicado', () => {
  const root = fixture(['a/index.html', 'b/mfe.js']);
  const plan = planAssembly(root, [
    { from: 'a', to: '' },
    { from: 'b', to: '_mfe/x' },
  ]);
  assert.deepEqual(
    [...plan],
    [
      ['index.html', 'a/index.html'],
      ['_mfe/x/mfe.js', 'b/mfe.js'],
    ],
  );
});

test('falha quando dois apps emitem o mesmo caminho', () => {
  const root = fixture(['a/recrutador/index.html', 'b/recrutador/index.html']);
  assert.throws(
    () =>
      planAssembly(root, [
        { from: 'a', to: '' },
        { from: 'b', to: '' },
      ]),
    /mesmo caminho[\s\S]*recrutador\/index\.html/,
  );
});

test('falha quando falta a saída de um app', () => {
  const root = fixture(['a/index.html']);
  assert.throws(() => planAssembly(root, [{ from: 'nao-buildado', to: '' }]), /ausente/);
});

test('publica a pré-carga de segmento do Next.js com o nome que o cliente pede', () => {
  assert.equal(
    flattenNextSegment('comunidade/__next.$oc$slug/__PAGE__.txt'),
    'comunidade/__next.$oc$slug.__PAGE__.txt',
  );
  assert.equal(flattenNextSegment('comunidade/__next._tree.txt'), 'comunidade/__next._tree.txt');
  assert.equal(flattenNextSegment('_next/static/chunks/a.js'), '_next/static/chunks/a.js');
});

test('buildVercelConfig gera rewrites para as 3 áreas do shell nos 3 idiomas', () => {
  const config = buildVercelConfig();
  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, true);
  assert.equal(config.rewrites.length, 9);

  // MFE técnico em pt-BR e en
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/tecnico/:path*' && r.destination === '/tecnico/index.html',
    ),
  );
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/en/tech/:path*' && r.destination === '/en/tech/index.html',
    ),
  );

  // MFE recrutador em pt-BR e es
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/recrutador/:path*' && r.destination === '/recrutador/index.html',
    ),
  );
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/es/reclutador/:path*' && r.destination === '/es/reclutador/index.html',
    ),
  );

  // MFE clientes em pt-BR e en
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/clientes/:path*' && r.destination === '/clientes/index.html',
    ),
  );
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/en/clients/:path*' && r.destination === '/en/clients/index.html',
    ),
  );
});

test('buildVercelConfig define cabeçalhos de cache para assets estáticos e HTML', () => {
  const config = buildVercelConfig();
  assert.ok(config.headers.length >= 4);

  const nextStatic = config.headers.find((h) => h.source === '/_next/static/(.*)');
  assert.ok(nextStatic);
  assert.equal(nextStatic.headers[0].value, 'public, max-age=31536000, immutable');

  const fonts = config.headers.find((h) => h.source === '/_ds/fonts/(.*)');
  assert.ok(fonts);
  assert.equal(fonts.headers[0].value, 'public, max-age=31536000, immutable');

  const audio = config.headers.find((h) => h.source === '/_home/audio/(.*)');
  assert.ok(audio);
  assert.equal(audio.headers[0].value, 'public, max-age=31536000, immutable');

  const html = config.headers.find((h) => h.source === '/(.*)\\.html');
  assert.ok(html);
  assert.equal(html.headers[0].value, 'public, max-age=0, must-revalidate');
});

test('buildVercelConfig esconde dos buscadores todo endereço que não seja o de produção', () => {
  const config = buildVercelConfig();
  const rule = config.headers.find((h) =>
    h.headers.some((header) => header.key === 'X-Robots-Tag'),
  );
  assert.ok(rule);
  assert.equal(rule.source, '/(.*)');
  assert.deepEqual(rule.missing, [{ type: 'host', value: PRODUCTION_HOST }]);
  assert.deepEqual(rule.headers, [{ key: 'X-Robots-Tag', value: 'noindex' }]);
  assert.match(PRODUCTION_HOST, /^[a-z0-9.-]+$/);
});

test('buildVercelConfig não guarda os bundles de nome fixo como imutáveis', () => {
  const config = buildVercelConfig();
  const mfe = config.headers.find((h) => h.source === '/_mfe/(.*)');
  assert.ok(mfe);
  assert.equal(mfe.headers[0].value, 'public, max-age=0, must-revalidate');
});

test('buildVercelConfig manda os cabeçalhos de segurança em toda resposta', () => {
  const config = buildVercelConfig();
  const rule = config.headers.find((h) => h.headers === SECURITY_HEADERS);
  assert.ok(rule);
  assert.equal(rule.source, '/(.*)');
  assert.equal(rule.missing, undefined);
  const keys = Object.fromEntries(SECURITY_HEADERS.map(({ key, value }) => [key, value]));
  assert.equal(keys['X-Frame-Options'], 'DENY');
  assert.equal(keys['X-Content-Type-Options'], 'nosniff');
  assert.match(keys['Referrer-Policy'], /strict-origin/);
  assert.match(keys['Permissions-Policy'], /camera=\(\)/);
});

test('buildSitemap lista as 18 páginas com os alternates de idioma e x-default', () => {
  const xml = buildSitemap();
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));

  const urlMatches = xml.match(/<url>/g);
  assert.equal(urlMatches?.length, 18);

  // Confere a home pt-BR
  assert.ok(xml.includes('<loc>https://2027.darioreis.dev/</loc>'));
  // Confere área de recrutador
  assert.ok(xml.includes('<loc>https://2027.darioreis.dev/recrutador/</loc>'));
  assert.ok(xml.includes('<loc>https://2027.darioreis.dev/en/recruiter/</loc>'));
  assert.ok(xml.includes('<loc>https://2027.darioreis.dev/es/reclutador/</loc>'));

  // Confere os alternates
  assert.ok(
    xml.includes(
      '<xhtml:link rel="alternate" hreflang="pt-BR" href="https://2027.darioreis.dev/recrutador/" />',
    ),
  );
  assert.ok(
    xml.includes(
      '<xhtml:link rel="alternate" hreflang="en" href="https://2027.darioreis.dev/en/recruiter/" />',
    ),
  );
  assert.ok(
    xml.includes(
      '<xhtml:link rel="alternate" hreflang="es" href="https://2027.darioreis.dev/es/reclutador/" />',
    ),
  );
  assert.ok(
    xml.includes(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://2027.darioreis.dev/recrutador/" />',
    ),
  );
});

test('buildRobotsTxt aponta para o sitemap de produção', () => {
  const robots = buildRobotsTxt();
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://2027.darioreis.dev/sitemap.xml'));
});

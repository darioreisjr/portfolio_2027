import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { buildVercelConfig, flattenNextSegment, planAssembly } from './assemble.mjs';

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

test('buildVercelConfig gera rewrites para as 3 áreas do shell nos 4 idiomas', () => {
  const config = buildVercelConfig();
  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, true);
  assert.equal(config.rewrites.length, 12);

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

  // MFE clientes em pt-BR e pt-PT
  assert.ok(
    config.rewrites.some(
      (r) => r.source === '/clientes/:path*' && r.destination === '/clientes/index.html',
    ),
  );
  assert.ok(
    config.rewrites.some(
      (r) =>
        r.source === '/pt-pt/clientes/:path*' && r.destination === '/pt-pt/clientes/index.html',
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

  const html = config.headers.find((h) => h.source === '/(.*)\\.html');
  assert.ok(html);
  assert.equal(html.headers[0].value, 'public, max-age=0, must-revalidate');
});

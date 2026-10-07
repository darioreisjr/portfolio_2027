import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { flattenNextSegment, planAssembly } from './assemble.mjs';

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

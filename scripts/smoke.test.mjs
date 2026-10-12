import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { pagesIn, problemsOf } from './smoke.mjs';

test('as páginas são os index.html do dist, fora as pastas de assets', () => {
  const root = mkdtempSync(join(tmpdir(), 'smoke-'));
  for (const file of [
    'index.html',
    'recrutador/index.html',
    'en/tech/index.html',
    '_next/static/x/index.html',
    '_mfe/vue/mfe.js',
  ]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), '');
  }
  assert.deepEqual(pagesIn(root), ['/', '/en/tech/', '/recrutador/']);
});

const page = (overrides = {}) => ({
  path: '/',
  status: 200,
  robots: null,
  body: '<!doctype html><html lang="pt-BR"></html>',
  ...overrides,
});

test('a produção precisa responder e não pode estar escondida dos buscadores', () => {
  assert.deepEqual(problemsOf(page(), true), []);
  assert.match(problemsOf(page({ robots: 'noindex' }), true)[0], /produção com X-Robots-Tag/);
  assert.match(problemsOf(page({ status: 404 }), true)[0], /respondeu 404/);
  assert.match(problemsOf(page({ body: 'erro' }), true)[0], /não é uma página HTML/);
});

test('o ambiente de desenvolvimento precisa do noindex', () => {
  assert.deepEqual(problemsOf(page({ robots: 'noindex' }), false), []);
  assert.match(problemsOf(page(), false)[0], /sem X-Robots-Tag: noindex/);
});

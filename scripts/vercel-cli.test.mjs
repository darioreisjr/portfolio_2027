import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// A versão da Vercel CLI é fixa e aparece em três lugares. Não dá para ter um
// só: `republicar.yml` roda o código de tags antigas, onde um arquivo central
// ainda não existiria. Este teste impede atualizar um lugar e esquecer os outros.
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const versions = (text) => [...text.matchAll(/vercel@(\d+\.\d+\.\d+)/g)].map((match) => match[1]);

test('a Vercel CLI tem a mesma versão nos workflows e na skill de deploy', () => {
  const found = [
    '.github/workflows/ci.yml',
    '.github/workflows/republicar.yml',
    '.agents/skills/deploy-vercel/SKILL.md',
  ].map((path) => [path, versions(read(path))]);

  for (const [path, list] of found) assert.ok(list.length > 0, `${path} não cita a versão`);
  const all = new Set(found.flatMap(([, list]) => list));
  assert.equal(all.size, 1, `versões diferentes: ${JSON.stringify(found)}`);
});

test('nenhum workflow usa a Vercel CLI sem versão fixa', () => {
  for (const path of ['.github/workflows/ci.yml', '.github/workflows/republicar.yml']) {
    assert.doesNotMatch(read(path), /vercel@latest/, path);
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIRST_VERSION, nextVersion, parseCommit, renderNotes } from './release.mjs';

const commit = (message, hash = 'abcdef1234567890') => ({ ...parseCommit(message), hash });
/** As linhas das notas, para comparar uma linha inteira por igualdade. */
const lines = (notes) => notes.split(String.fromCharCode(10));

test('interpreta tipo, escopo, resumo e mudança que quebra', () => {
  assert.deepEqual(parseCommit('feat(mfe-vue): período nos projetos'), {
    type: 'feat',
    scope: 'mfe-vue',
    subject: 'período nos projetos',
    breaking: false,
  });
  assert.equal(parseCommit('docs: atualiza o README').scope, null);
  assert.equal(parseCommit('feat(content)!: troca o modelo').breaking, true);
  assert.equal(
    parseCommit('refactor: muda a carga\n\nBREAKING CHANGE: o módulo mudou de nome').breaking,
    true,
  );
  // O corpo que só cita a expressão não conta.
  assert.equal(parseCommit('fix: corrige\n\nnão é BREAKING CHANGE: nada').breaking, false);
});

test('mensagem fora do padrão não é commit de release', () => {
  assert.equal(parseCommit('Merge pull request #3 from x/y'), null);
  assert.equal(parseCommit('arruma coisas'), null);
});

test('sem tag anterior, a primeira versão sai qualquer que seja o commit', () => {
  assert.equal(nextVersion(null, [commit('docs: só documentação')]), FIRST_VERSION);
  assert.equal(nextVersion(null, []), '1.0.0');
});

test('feat sobe a menor, fix e perf o remendo, quebra a maior; vale o maior', () => {
  assert.equal(nextVersion('1.2.3', [commit('fix: a')]), '1.2.4');
  assert.equal(nextVersion('1.2.3', [commit('perf: a')]), '1.2.4');
  assert.equal(nextVersion('1.2.3', [commit('fix: a'), commit('feat: b')]), '1.3.0');
  assert.equal(nextVersion('1.2.3', [commit('feat: b'), commit('fix!: c')]), '2.0.0');
});

test('só docs, testes e manutenção não geram versão', () => {
  const quiet = ['docs: a', 'test: b', 'chore: c', 'ci: d', 'build: e', 'refactor: f', 'style: g'];
  assert.equal(
    nextVersion(
      '1.0.0',
      quiet.map((message) => commit(message)),
    ),
    null,
  );
  assert.equal(nextVersion('1.0.0', []), null);
});

test('as notas agrupam por tipo, em português, e deixam o resto de fora', () => {
  const notes = renderNotes({
    version: '1.1.0',
    previous: '1.0.0',
    repository: 'dono/repo',
    commits: [
      commit('feat(mfe-vue): período nos projetos', '1111111aaaaaaa'),
      commit('fix: corrige o foco', '2222222bbbbbbb'),
      commit('docs: atualiza o README', '3333333ccccccc'),
      commit('feat(content)!: troca o modelo', '4444444ddddddd'),
    ],
  });
  const titles = notes.split('\n').filter((line) => line.startsWith('## '));
  assert.deepEqual(titles, ['## Mudanças que quebram', '## Novidades', '## Correções']);
  assert.match(notes, /- \*\*mfe-vue:\*\* período nos projetos \(\[1111111\]\(/);
  assert.match(notes, /- corrige o foco/);
  // A mudança que quebra aparece uma vez só, na seção dela.
  assert.equal(notes.match(/troca o modelo/g).length, 1);
  assert.doesNotMatch(notes, /README/);
  // A linha inteira, por igualdade: endereço não se confere com expressão regular.
  assert.ok(
    lines(notes).includes(
      'Todas as mudanças: https://github.com/dono/repo/compare/v1.0.0...v1.1.0',
    ),
  );
});

test('a primeira release leva uma nota curta, com o caminho do histórico', () => {
  const notes = renderNotes({
    version: '1.0.0',
    previous: null,
    repository: 'dono/repo',
    commits: [commit('feat: tudo')],
  });
  assert.match(notes, /Primeira versão publicada/);
  assert.ok(
    lines(notes).includes('Histórico completo: https://github.com/dono/repo/commits/v1.0.0'),
  );
  assert.doesNotMatch(notes, /## /);
});

#!/usr/bin/env node
// Release automática da produção (ADR 0014). Lê os commits desde a última tag
// `vX.Y.Z`, calcula a próxima versão pelos Conventional Commits e cria a tag e a
// release no GitHub, com as notas em português. A versão vive só na tag: nenhum
// commit volta para a branch, para `production` e `development` não divergirem.
//
//   node scripts/release.mjs            cria a release (precisa do `gh` e de GH_TOKEN)
//   node scripts/release.mjs --dry-run  só mostra a versão e as notas

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** A primeira versão, quando ainda não existe tag. */
export const FIRST_VERSION = '1.0.0';

/** Seções das notas, na ordem em que aparecem. Os outros tipos não entram. */
const SECTIONS = [
  ['breaking', 'Mudanças que quebram'],
  ['feat', 'Novidades'],
  ['fix', 'Correções'],
  ['perf', 'Desempenho'],
];

const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?: (?<subject>.+)$/;

/** Interpreta a mensagem de um commit; `null` se não for Conventional Commit. */
export function parseCommit(message) {
  const [first = '', ...rest] = message.trim().split('\n');
  const match = HEADER.exec(first.trim());
  if (!match?.groups) return null;
  const { type, scope, bang, subject } = match.groups;
  const breaking = Boolean(bang) || rest.some((line) => /^BREAKING[ -]CHANGE: /.test(line));
  return { type, scope: scope ?? null, subject, breaking };
}

/** Quanto um commit sobe a versão: 3 a maior, 2 a menor, 1 o remendo, 0 nada. */
const weight = (commit) => {
  if (commit.breaking) return 3;
  if (commit.type === 'feat') return 2;
  if (commit.type === 'fix' || commit.type === 'perf') return 1;
  return 0;
};

/**
 * A próxima versão, ou `null` quando nenhum commit gera release (só docs, testes,
 * manutenção). Sem versão anterior, é a primeira, qualquer que seja o commit.
 */
export function nextVersion(previous, commits) {
  if (!previous) return FIRST_VERSION;
  const bump = Math.max(0, ...commits.map(weight));
  if (bump === 0) return null;
  const [major, minor, patch] = previous.split('.').map(Number);
  if (bump === 3) return `${major + 1}.0.0`;
  if (bump === 2) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Notas da release, em Markdown. */
export function renderNotes({ version, previous, commits, repository }) {
  const base = `https://github.com/${repository}`;
  if (!previous) {
    return [
      'Primeira versão publicada do portfólio.',
      '',
      `Histórico completo: ${base}/commits/v${version}`,
      '',
    ].join('\n');
  }

  const lines = [];
  for (const [key, title] of SECTIONS) {
    const items = commits.filter((commit) =>
      key === 'breaking' ? commit.breaking : !commit.breaking && commit.type === key,
    );
    if (items.length === 0) continue;
    lines.push(`## ${title}`, '');
    for (const { scope, subject, hash } of items) {
      const where = scope ? `**${scope}:** ` : '';
      const link = hash ? ` ([${hash.slice(0, 7)}](${base}/commit/${hash}))` : '';
      lines.push(`- ${where}${subject}${link}`);
    }
    lines.push('');
  }
  lines.push(`Todas as mudanças: ${base}/compare/v${previous}...v${version}`, '');
  return lines.join('\n');
}

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function lastTag() {
  try {
    return git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*');
  } catch {
    return null;
  }
}

/** Commits de `range`, sem os de merge, do mais novo para o mais antigo. */
function commitsIn(range) {
  const raw = git('log', '--no-merges', '--format=%H%x1f%B%x1e', range);
  return raw
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [hash, message = ''] = entry.split('\x1f');
      const commit = parseCommit(message);
      return commit ? { ...commit, hash } : [];
    });
}

function summary(text) {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const head = git('rev-parse', 'HEAD');

  // Reexecução do job: o commit já tem versão.
  const here = git('tag', '--points-at', head, '--list', 'v[0-9]*');
  if (here) return summary(`Sem release: este commit já é a ${here.split('\n')[0]}.`);

  const tag = lastTag();
  const previous = tag ? tag.slice(1) : null;
  const commits = commitsIn(tag ? `${tag}..HEAD` : 'HEAD');
  const version = nextVersion(previous, commits);
  if (!version) {
    return summary(`Sem release: nenhum commit desde a ${tag} gera versão (só feat, fix e perf).`);
  }

  const repository = process.env.GITHUB_REPOSITORY ?? 'darioreisjr/portfolio_2027';
  const notes = renderNotes({ version, previous, commits, repository });
  if (dryRun) return console.log(`v${version}\n\n${notes}`);

  const file = join(mkdtempSync(join(tmpdir(), 'release-')), 'notas.md');
  writeFileSync(file, notes);
  execFileSync(
    'gh',
    ['release', 'create', `v${version}`, '--target', head, '--title', `v${version}`, '-F', file],
    { stdio: 'inherit' },
  );
  summary(`### Release v${version}\n\n${notes}`);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

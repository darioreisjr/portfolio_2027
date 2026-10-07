#!/usr/bin/env node
// Gera as configurações nativas de Claude Code, Codex CLI e Gemini CLI a partir
// das fontes únicas do repositório. Sem dependências.
//
//   node scripts/ai-sync.mjs           escreve os arquivos gerados
//   node scripts/ai-sync.mjs --check   falha se algo estiver fora de sincronia (CI)
//
// Fontes -> gerados:
//   .agents/skills/**            -> .claude/skills/**
//   docs/ai-setup/agents.md      -> .claude/agents/*.md, .codex/agents/*.toml, .gemini/agents/*.md
//   docs/ai-setup/mcp.json       -> .mcp.json, .codex/config.toml, .gemini/settings.json
//   {apps,packages}/*/AGENTS.md  -> CLAUDE.md e GEMINI.md ao lado

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

const NOTICE = 'GERADO por scripts/ai-sync.mjs. Não edite; altere a fonte e rode o script.';
// Diretórios inteiramente gerados: arquivo que não vier de uma fonte é removido.
const MANAGED_DIRS = ['.claude/skills', '.claude/agents', '.codex/agents', '.gemini/agents'];
const AGENTS_MD_MAX_LINES = 200;

const normalize = (text) => text.replace(/\r\n/g, '\n');
const read = (path) => normalize(readFileSync(join(root, path), 'utf8'));
const exists = (path) => existsSync(join(root, path));

function walk(dir) {
  if (!exists(dir)) return [];
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function subdirs(dir) {
  if (!exists(dir)) return [];
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${dir}/${entry.name}`);
}

/** Caminho relativo -> conteúdo esperado. */
const expected = new Map();
const problems = [];

// Skills: cópia fiel para o único caminho que o Claude Code lê.
function planSkills() {
  for (const skillDir of subdirs('.agents/skills')) {
    if (!exists(`${skillDir}/SKILL.md`)) {
      problems.push(`${skillDir}: falta SKILL.md`);
      continue;
    }
    const name = skillDir.split('/').pop();
    const frontmatter = read(`${skillDir}/SKILL.md`).match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter || !new RegExp(`^name: ${name}$`, 'm').test(frontmatter[1])) {
      problems.push(`${skillDir}/SKILL.md: frontmatter precisa de "name: ${name}" (igual ao nome da pasta)`);
    }
    if (!frontmatter || !/^description: \S/m.test(frontmatter[1])) {
      problems.push(`${skillDir}/SKILL.md: frontmatter precisa de "description"`);
    }
  }
  for (const file of walk('.agents/skills')) {
    expected.set(file.replace(/^\.agents\/skills/, '.claude/skills'), read(file));
  }
}

function parseAgents() {
  const source = 'docs/ai-setup/agents.md';
  const fence = /```json\n([\s\S]*?)\n```/;
  const sections = read(source)
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const lineEnd = section.indexOf('\n');
      return { title: section.slice(0, lineEnd).trim(), body: section.slice(lineEnd + 1) };
    });

  const profilesSection = sections.find((section) => section.title === 'Perfis de permissão');
  if (!profilesSection || !fence.test(profilesSection.body)) {
    throw new Error(`${source}: seção "Perfis de permissão" com bloco json não encontrada`);
  }
  const profiles = JSON.parse(profilesSection.body.match(fence)[1]);

  const agents = sections
    .filter((section) => /^[a-z0-9-]+$/.test(section.title))
    .map((section) => {
      const block = section.body.match(fence);
      if (!block) throw new Error(`${source}: agente "${section.title}" sem bloco json`);
      const meta = JSON.parse(block[1]);
      const profile = profiles[meta.profile];
      if (!meta.description || !profile) {
        throw new Error(`${source}: agente "${section.title}" precisa de "description" e de um "profile" existente`);
      }
      const prompt = section.body.replace(fence, '').trim();
      if (prompt.includes("'''")) {
        throw new Error(`${source}: o prompt de "${section.title}" não pode conter ''' (delimitador do TOML)`);
      }
      return { name: section.title, description: meta.description, profile, prompt };
    });

  if (agents.length === 0) throw new Error(`${source}: nenhum agente encontrado`);
  return agents;
}

function planAgents() {
  for (const agent of parseAgents()) {
    const description = JSON.stringify(agent.description);

    expected.set(
      `.claude/agents/${agent.name}.md`,
      [
        '---',
        `name: ${agent.name}`,
        `description: ${description}`,
        `tools: ${agent.profile.claude.join(', ')}`,
        '---',
        `<!-- ${NOTICE} Fonte: docs/ai-setup/agents.md -->`,
        '',
        agent.prompt,
        '',
      ].join('\n'),
    );

    expected.set(
      `.gemini/agents/${agent.name}.md`,
      [
        '---',
        `name: ${agent.name}`,
        `description: ${description}`,
        'kind: local',
        'tools:',
        ...agent.profile.gemini.map((tool) => `  - ${tool}`),
        '---',
        `<!-- ${NOTICE} Fonte: docs/ai-setup/agents.md -->`,
        '',
        agent.prompt,
        '',
      ].join('\n'),
    );

    expected.set(
      `.codex/agents/${agent.name}.toml`,
      [
        `# ${NOTICE} Fonte: docs/ai-setup/agents.md`,
        `name = ${JSON.stringify(agent.name)}`,
        `description = ${description}`,
        `sandbox_mode = ${JSON.stringify(agent.profile.codex)}`,
        "developer_instructions = '''",
        agent.prompt,
        "'''",
        '',
      ].join('\n'),
    );
  }
}

// MCP: os mesmos servidores, no formato de cada ferramenta. Segredos só por variável de ambiente.
function planMcp() {
  const { servers } = JSON.parse(read('docs/ai-setup/mcp.json'));
  const claude = {};
  const gemini = {};
  const codex = [`# ${NOTICE} Fonte: docs/ai-setup/mcp.json`];

  for (const [name, server] of Object.entries(servers)) {
    codex.push('', `[mcp_servers.${name}]`);

    if (server.transport === 'stdio') {
      const entry = { command: server.command, args: server.args ?? [] };
      claude[name] = entry;
      gemini[name] = entry;
      codex.push(`command = ${JSON.stringify(entry.command)}`, `args = ${JSON.stringify(entry.args)}`);
      continue;
    }

    if (server.transport !== 'http') {
      throw new Error(`docs/ai-setup/mcp.json: transporte desconhecido em "${name}"`);
    }
    const headers = server.headers ?? {};
    const bearer = server.bearerEnv;
    claude[name] = {
      type: 'http',
      url: server.url,
      headers: { ...headers, ...(bearer && { Authorization: `Bearer \${${bearer}}` }) },
    };
    gemini[name] = {
      httpUrl: server.url,
      headers: { ...headers, ...(bearer && { Authorization: `Bearer $${bearer}` }) },
    };
    codex.push(`url = ${JSON.stringify(server.url)}`);
    if (bearer) codex.push(`bearer_token_env_var = ${JSON.stringify(bearer)}`);
    const headerPairs = Object.entries(headers).map(([key, value]) => `${JSON.stringify(key)} = ${JSON.stringify(value)}`);
    if (headerPairs.length > 0) codex.push(`http_headers = { ${headerPairs.join(', ')} }`);
  }

  expected.set('.mcp.json', `${JSON.stringify({ mcpServers: claude }, null, 2)}\n`);
  expected.set('.gemini/settings.json', `${JSON.stringify({ mcpServers: gemini }, null, 2)}\n`);
  expected.set('.codex/config.toml', `${codex.join('\n')}\n`);
}

// Com CLAUDE.md na raiz, o Claude Code ignora AGENTS.md aninhado; o Gemini só lê GEMINI.md.
function planAdapters() {
  for (const dir of [...subdirs('apps'), ...subdirs('packages')]) {
    if (!exists(`${dir}/AGENTS.md`)) continue;
    expected.set(`${dir}/CLAUDE.md`, '@AGENTS.md\n');
    expected.set(`${dir}/GEMINI.md`, '@./AGENTS.md\n');
  }
}

function checkHandWritten() {
  const hasLine = (path, line) => exists(path) && read(path).split('\n').includes(line);
  if (!hasLine('CLAUDE.md', '@AGENTS.md')) problems.push('CLAUDE.md: precisa da linha "@AGENTS.md"');
  if (!hasLine('GEMINI.md', '@./AGENTS.md')) problems.push('GEMINI.md: precisa da linha "@./AGENTS.md"');
  if (!exists('AGENTS.md')) {
    problems.push('AGENTS.md: não existe');
  } else if (read('AGENTS.md').split('\n').length >= AGENTS_MD_MAX_LINES) {
    problems.push(`AGENTS.md: precisa ter menos de ${AGENTS_MD_MAX_LINES} linhas`);
  }
}

planSkills();
planAgents();
planMcp();
planAdapters();
checkHandWritten();

const stale = MANAGED_DIRS.flatMap(walk).filter((file) => !expected.has(file));

if (check) {
  for (const [path, content] of expected) {
    if (!exists(path)) problems.push(`${path}: não existe`);
    else if (read(path) !== content) problems.push(`${path}: difere da fonte`);
  }
  for (const file of stale) problems.push(`${file}: não tem fonte correspondente`);
} else {
  for (const [path, content] of expected) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  for (const file of stale) rmSync(join(root, file));
}

if (problems.length > 0) {
  console.error(problems.map((problem) => `- ${problem}`).join('\n'));
  console.error(check ? '\nFora de sincronia. Rode: node scripts/ai-sync.mjs' : '\nCorrija os problemas acima.');
  process.exit(1);
}
console.log(check ? `Em sincronia: ${expected.size} arquivos.` : `Gerados ${expected.size} arquivos; removidos ${stale.length}.`);

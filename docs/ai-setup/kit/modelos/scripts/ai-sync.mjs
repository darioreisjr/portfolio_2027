#!/usr/bin/env node
// Gera as configurações nativas de Claude Code, Codex CLI, Gemini CLI e Antigravity CLI
// a partir das fontes únicas do repositório. Sem dependências; só Node 20 ou mais novo.
//
//   node scripts/ai-sync.mjs           escreve os arquivos gerados
//   node scripts/ai-sync.mjs --check   falha se algo estiver fora de sincronia (CI e pre-commit)
//
// Fontes -> gerados (só das ferramentas ligadas em CONFIG.targets):
//   .agents/skills/**             -> .claude/skills/** (Codex, Gemini e Antigravity leem a fonte)
//   docs/ai-setup/agents.md       -> .claude/agents, .codex/agents, .gemini/agents, .agents/agents
//   docs/ai-setup/mcp.json        -> .mcp.json, .codex/config.toml, .gemini/settings.json,
//                                    .agents/mcp_config.json
//   docs/ai-setup/hooks.json      -> .claude/settings.json, .codex/hooks.json,
//                                    .gemini/settings.json, .agents/hooks.json
//   docs/ai-setup/settings.json   -> extras mesclados em .claude/settings.json e .gemini/settings.json
//   <pasta>/AGENTS.md aninhado    -> CLAUDE.md e GEMINI.md ao lado
//
// O módulo também exporta plan(), usado pelo hook que bloqueia edição de arquivo gerado.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------------------------
// Ajuste por projeto
// ---------------------------------------------------------------------------------------------
export const CONFIG = {
  /** Ferramentas para as quais gerar configuração: 'claude', 'codex', 'gemini', 'antigravity'. */
  targets: ['claude', 'codex', 'gemini', 'antigravity'],
  /**
   * Pastas com AGENTS.md próprio. "x/*" quer dizer cada subpasta de x.
   * Exemplo de monorepo: ['apps/*', 'packages/*']. Projeto de uma pasta só: [].
   */
  nestedAgentsDirs: [],
  /** Tamanho máximo do AGENTS.md da raiz, em linhas. */
  agentsMdMaxLines: 200,
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NOTICE = 'GERADO por scripts/ai-sync.mjs. Não edite; altere a fonte e rode o script.';
const SOURCES = {
  skills: '.agents/skills',
  agents: 'docs/ai-setup/agents.md',
  mcp: 'docs/ai-setup/mcp.json',
  hooks: 'docs/ai-setup/hooks.json',
  settings: 'docs/ai-setup/settings.json',
};
// Diretórios inteiramente gerados, por ferramenta: arquivo que não vier de uma fonte é removido.
// Arquivos soltos de uma ferramenta desligada (como .gemini/settings.json) são apagados à mão.
const MANAGED_DIRS = {
  claude: ['.claude/skills', '.claude/agents'],
  codex: ['.codex/agents'],
  gemini: ['.gemini/agents'],
  antigravity: ['.agents/agents'],
};
// Ferramentas que editam arquivos, por evento de cada CLI. Confira ao atualizar uma CLI.
const EDIT_TOOLS = {
  claude: 'Edit|Write|NotebookEdit',
  codex: 'apply_patch|Edit|Write',
  gemini: 'write_file|replace',
  antigravity:
    'write_to_file|replace_file_content|multi_replace_file_content|create_file|edit_file',
};
const HOOK_EVENTS = {
  'before-edit': {
    claude: 'PreToolUse',
    codex: 'PreToolUse',
    gemini: 'BeforeTool',
    antigravity: 'PreToolUse',
  },
  'after-edit': {
    claude: 'PostToolUse',
    codex: 'PostToolUse',
    gemini: 'AfterTool',
    antigravity: 'PostToolUse',
  },
};

// ---------------------------------------------------------------------------------------------

const normalize = (text) => text.replace(/\r\n/g, '\n');
const read = (path) => normalize(readFileSync(join(root, path), 'utf8'));
const exists = (path) => existsSync(join(root, path));
const readJson = (path) => (exists(path) ? JSON.parse(read(path)) : {});
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

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

/**
 * Monta tudo o que deveria existir, sem escrever nada.
 * @returns {{ expected: Map<string, { content: string, source: string }>, managedDirs: string[], problems: string[], notes: string[] }}
 */
export function plan() {
  const on = (target) => CONFIG.targets.includes(target);
  const expected = new Map();
  const problems = [];
  const notes = [];
  const emit = (path, content, source) => expected.set(path, { content, source });

  // Configurações que recebem mais de uma fonte (MCP, hooks e extras) e são escritas no fim.
  const settings = readJson(SOURCES.settings);
  const claudeSettings = { ...settings.claude };
  const geminiSettings = { ...settings.gemini };

  // Skills: cópia fiel para o único caminho que o Claude Code lê.
  for (const skillDir of subdirs(SOURCES.skills)) {
    if (!exists(`${skillDir}/SKILL.md`)) {
      problems.push(`${skillDir}: falta SKILL.md`);
      continue;
    }
    const name = skillDir.split('/').pop();
    const frontmatter = read(`${skillDir}/SKILL.md`).match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter || !new RegExp(`^name: ${name}$`, 'm').test(frontmatter[1])) {
      problems.push(`${skillDir}/SKILL.md: frontmatter precisa de "name: ${name}" (igual à pasta)`);
    }
    if (!frontmatter || !/^description: \S/m.test(frontmatter[1])) {
      problems.push(`${skillDir}/SKILL.md: frontmatter precisa de "description"`);
    }
  }
  if (on('claude')) {
    for (const file of walk(SOURCES.skills)) {
      emit(file.replace(SOURCES.skills, '.claude/skills'), read(file), file);
    }
  }

  // Subagentes.
  for (const agent of parseAgents(problems)) {
    const description = JSON.stringify(agent.description);
    const header = `<!-- ${NOTICE} Fonte: ${SOURCES.agents} -->`;
    const missing = CONFIG.targets.filter(
      (target) => target !== 'codex' && !Array.isArray(agent.profile[target]),
    );
    if (missing.length > 0) {
      problems.push(
        `${SOURCES.agents}: perfil "${agent.profileName}" sem lista para ${missing.join(', ')}`,
      );
      continue;
    }
    if (on('claude')) {
      emit(
        `.claude/agents/${agent.name}.md`,
        [
          '---',
          `name: ${agent.name}`,
          `description: ${description}`,
          `tools: ${agent.profile.claude.join(', ')}`,
          '---',
          header,
          '',
          agent.prompt,
          '',
        ].join('\n'),
        SOURCES.agents,
      );
    }
    if (on('gemini')) {
      emit(
        `.gemini/agents/${agent.name}.md`,
        [
          '---',
          `name: ${agent.name}`,
          `description: ${description}`,
          'kind: local',
          'tools:',
          ...agent.profile.gemini.map((tool) => `  - ${tool}`),
          '---',
          header,
          '',
          agent.prompt,
          '',
        ].join('\n'),
        SOURCES.agents,
      );
    }
    if (on('antigravity')) {
      emit(
        `.agents/agents/${agent.name}.md`,
        [
          '---',
          `name: ${agent.name}`,
          `description: ${description}`,
          'tools:',
          ...agent.profile.antigravity.map((tool) => `  - ${tool}`),
          '---',
          header,
          '',
          agent.prompt,
          '',
        ].join('\n'),
        SOURCES.agents,
      );
    }
    if (on('codex')) {
      if (typeof agent.profile.codex !== 'string') {
        problems.push(
          `${SOURCES.agents}: perfil "${agent.profileName}" precisa de "codex" (sandbox_mode)`,
        );
      }
      emit(
        `.codex/agents/${agent.name}.toml`,
        [
          `# ${NOTICE} Fonte: ${SOURCES.agents}`,
          `name = ${JSON.stringify(agent.name)}`,
          `description = ${description}`,
          `sandbox_mode = ${JSON.stringify(agent.profile.codex)}`,
          "developer_instructions = '''",
          agent.prompt,
          "'''",
          '',
        ].join('\n'),
        SOURCES.agents,
      );
    }
  }

  // MCP: os mesmos servidores no formato de cada ferramenta. Segredo só por variável de ambiente.
  const { servers = {} } = readJson(SOURCES.mcp);
  const mcp = { claude: {}, gemini: {}, antigravity: {} };
  const codexToml = [`# ${NOTICE} Fonte: ${SOURCES.mcp}`];
  for (const [name, server] of Object.entries(servers)) {
    if (server.transport === 'stdio') {
      const entry = { command: server.command, args: server.args ?? [] };
      mcp.claude[name] = entry;
      mcp.gemini[name] = entry;
      mcp.antigravity[name] = entry;
      codexToml.push(
        '',
        `[mcp_servers.${name}]`,
        `command = ${JSON.stringify(entry.command)}`,
        `args = ${JSON.stringify(entry.args)}`,
      );
      continue;
    }
    if (server.transport !== 'http') {
      problems.push(`${SOURCES.mcp}: transporte desconhecido em "${name}" (use "http" ou "stdio")`);
      continue;
    }
    const headers = server.headers ?? {};
    const bearer = server.bearerEnv;
    mcp.claude[name] = {
      type: 'http',
      url: server.url,
      headers: { ...headers, ...(bearer && { Authorization: `Bearer \${${bearer}}` }) },
    };
    mcp.gemini[name] = {
      httpUrl: server.url,
      headers: { ...headers, ...(bearer && { Authorization: `Bearer $${bearer}` }) },
    };
    // O Antigravity não documenta expansão de variável no mcp_config.json: servidor com segredo
    // fica de fora do arquivo do projeto e é configurado no arquivo global do usuário.
    if (bearer)
      notes.push(
        `Antigravity: "${name}" usa segredo; configure em ~/.gemini/config/mcp_config.json`,
      );
    else mcp.antigravity[name] = { serverUrl: server.url, headers };
    codexToml.push('', `[mcp_servers.${name}]`, `url = ${JSON.stringify(server.url)}`);
    if (bearer) codexToml.push(`bearer_token_env_var = ${JSON.stringify(bearer)}`);
    const pairs = Object.entries(headers).map(
      ([k, v]) => `${JSON.stringify(k)} = ${JSON.stringify(v)}`,
    );
    if (pairs.length > 0) codexToml.push(`http_headers = { ${pairs.join(', ')} }`);
  }
  if (on('claude')) emit('.mcp.json', json({ mcpServers: mcp.claude }), SOURCES.mcp);
  if (on('codex')) emit('.codex/config.toml', `${codexToml.join('\n')}\n`, SOURCES.mcp);
  if (on('antigravity'))
    emit('.agents/mcp_config.json', json({ mcpServers: mcp.antigravity }), SOURCES.mcp);
  if (Object.keys(mcp.gemini).length > 0) geminiSettings.mcpServers = mcp.gemini;

  // Hooks: cada um é um script Node do repositório, chamado do jeito que cada CLI espera.
  const { hooks = {} } = readJson(SOURCES.hooks);
  const byTool = { claude: {}, codex: {}, gemini: {}, antigravity: {} };
  for (const [name, hook] of Object.entries(hooks)) {
    const events = HOOK_EVENTS[hook.when];
    if (!events) {
      problems.push(
        `${SOURCES.hooks}: "${name}" tem "when" desconhecido (use ${Object.keys(HOOK_EVENTS).join(' ou ')})`,
      );
      continue;
    }
    if (!hook.script || !exists(hook.script)) {
      problems.push(`${SOURCES.hooks}: "${name}" aponta para script inexistente: ${hook.script}`);
      continue;
    }
    const seconds = hook.timeoutSeconds ?? 30;
    const add = (tool, handler) => {
      const event = events[tool];
      byTool[tool][event] ??= [];
      byTool[tool][event].push({ matcher: EDIT_TOOLS[tool], hooks: [handler] });
    };
    add('claude', {
      type: 'command',
      command: `node "$CLAUDE_PROJECT_DIR/${hook.script}"`,
      timeout: seconds,
    });
    add('codex', {
      type: 'command',
      command: `node "$(git rev-parse --show-toplevel)/${hook.script}"`,
      timeout: seconds,
      statusMessage: hook.purpose,
    });
    add('gemini', {
      name,
      type: 'command',
      command: `node "$GEMINI_PROJECT_DIR/${hook.script}"`,
      timeout: seconds * 1000,
      description: hook.purpose,
    });
    add('antigravity', { type: 'command', command: `node ${hook.script}`, timeout: seconds });
  }
  if (Object.keys(byTool.claude).length > 0) claudeSettings.hooks = byTool.claude;
  if (Object.keys(byTool.gemini).length > 0) geminiSettings.hooks = byTool.gemini;
  if (on('codex') && Object.keys(byTool.codex).length > 0) {
    emit('.codex/hooks.json', json({ hooks: byTool.codex }), SOURCES.hooks);
  }
  if (on('antigravity') && Object.keys(byTool.antigravity).length > 0) {
    // No Antigravity a chave de topo é o nome de um grupo de hooks.
    emit('.agents/hooks.json', json({ 'ai-sync': byTool.antigravity }), SOURCES.hooks);
  }

  if (on('claude') && Object.keys(claudeSettings).length > 0) {
    emit(
      '.claude/settings.json',
      json({
        $schema: 'https://json.schemastore.org/claude-code-settings.json',
        ...claudeSettings,
      }),
      `${SOURCES.settings} e ${SOURCES.hooks}`,
    );
  }
  if (on('gemini') && Object.keys(geminiSettings).length > 0) {
    emit(
      '.gemini/settings.json',
      json(geminiSettings),
      `${SOURCES.mcp}, ${SOURCES.hooks} e ${SOURCES.settings}`,
    );
  }

  // Instruções: com CLAUDE.md na raiz, o Claude Code ignora AGENTS.md aninhado; o Gemini só lê GEMINI.md.
  for (const dir of nestedDirs()) {
    if (!exists(`${dir}/AGENTS.md`)) continue;
    if (on('claude')) emit(`${dir}/CLAUDE.md`, '@AGENTS.md\n', `${dir}/AGENTS.md`);
    if (on('gemini')) emit(`${dir}/GEMINI.md`, '@./AGENTS.md\n', `${dir}/AGENTS.md`);
  }
  const hasLine = (path, line) => exists(path) && read(path).split('\n').includes(line);
  if (!exists('AGENTS.md')) problems.push('AGENTS.md: não existe');
  else if (read('AGENTS.md').split('\n').length >= CONFIG.agentsMdMaxLines) {
    problems.push(`AGENTS.md: precisa ter menos de ${CONFIG.agentsMdMaxLines} linhas`);
  }
  if (on('claude') && !hasLine('CLAUDE.md', '@AGENTS.md'))
    problems.push('CLAUDE.md: precisa da linha "@AGENTS.md"');
  if (on('gemini') && !hasLine('GEMINI.md', '@./AGENTS.md'))
    problems.push('GEMINI.md: precisa da linha "@./AGENTS.md"');

  // Todas as ferramentas, ligadas ou não: desligar uma remove as pastas de agentes dela.
  const managedDirs = Object.values(MANAGED_DIRS).flat();
  return { expected, managedDirs, problems, notes };
}

function nestedDirs() {
  return CONFIG.nestedAgentsDirs.flatMap((pattern) =>
    pattern.endsWith('/*') ? subdirs(pattern.slice(0, -2)) : [pattern],
  );
}

function parseAgents(problems) {
  if (!exists(SOURCES.agents)) return [];
  const fence = /```json\n([\s\S]*?)\n```/;
  const sections = read(SOURCES.agents)
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const lineEnd = section.indexOf('\n');
      return { title: section.slice(0, lineEnd).trim(), body: section.slice(lineEnd + 1) };
    });

  const profilesSection = sections.find((section) => section.title === 'Perfis de permissão');
  if (!profilesSection || !fence.test(profilesSection.body)) {
    problems.push(`${SOURCES.agents}: seção "Perfis de permissão" com bloco json não encontrada`);
    return [];
  }
  const profiles = JSON.parse(profilesSection.body.match(fence)[1]);

  return sections
    .filter((section) => /^[a-z0-9-]+$/.test(section.title))
    .flatMap((section) => {
      const block = section.body.match(fence);
      if (!block) {
        problems.push(`${SOURCES.agents}: agente "${section.title}" sem bloco json`);
        return [];
      }
      const meta = JSON.parse(block[1]);
      const profile = profiles[meta.profile];
      if (!meta.description || !profile) {
        problems.push(
          `${SOURCES.agents}: agente "${section.title}" precisa de "description" e de um "profile" existente`,
        );
        return [];
      }
      const prompt = section.body.replace(fence, '').trim();
      if (prompt.includes("'''")) {
        problems.push(
          `${SOURCES.agents}: o prompt de "${section.title}" não pode conter ''' (delimitador do TOML)`,
        );
        return [];
      }
      return [
        {
          name: section.title,
          description: meta.description,
          profileName: meta.profile,
          profile,
          prompt,
        },
      ];
    });
}

function main() {
  const check = process.argv.includes('--check');
  const { expected, managedDirs, problems, notes } = plan();
  const stale = managedDirs.flatMap(walk).filter((file) => !expected.has(file));

  if (check) {
    for (const [path, { content }] of expected) {
      if (!exists(path)) problems.push(`${path}: não existe`);
      else if (read(path) !== content) problems.push(`${path}: difere da fonte`);
    }
    for (const file of stale) problems.push(`${file}: não tem fonte correspondente`);
  } else if (problems.length === 0) {
    for (const [path, { content }] of expected) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    for (const file of stale) rmSync(join(root, file));
    for (const note of notes) console.log(`Aviso: ${note}`);
  }

  if (problems.length > 0) {
    console.error(problems.map((problem) => `- ${problem}`).join('\n'));
    console.error(
      check
        ? '\nFora de sincronia. Rode: node scripts/ai-sync.mjs'
        : '\nCorrija os problemas acima.',
    );
    process.exit(1);
  }
  console.log(
    check
      ? `Em sincronia: ${expected.size} arquivos.`
      : `Gerados ${expected.size} arquivos; removidos ${stale.length}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

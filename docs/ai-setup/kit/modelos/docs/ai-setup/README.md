# Agentes de código neste repositório

As ferramentas de IA deste projeto leem as mesmas instruções. Há uma fonte de verdade para cada coisa; o resto é gerado por `scripts/ai-sync.mjs`. Montado a partir do kit de agentes, versão <<VERSAO DO KIT>>.

## Fontes e gerados

| O quê      | Edite aqui                       | Gerado                                                                                      |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| Instruções | `AGENTS.md`                      | `CLAUDE.md` e `GEMINI.md` de subpastas                                                      |
| Skills     | `.agents/skills/<nome>/SKILL.md` | `.claude/skills/`                                                                           |
| Subagentes | `docs/ai-setup/agents.md`        | `.claude/agents/`, `.codex/agents/`, `.gemini/agents/`, `.agents/agents/`                   |
| MCP        | `docs/ai-setup/mcp.json`         | `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json`, `.agents/mcp_config.json`       |
| Hooks      | `docs/ai-setup/hooks.json`       | `.claude/settings.json`, `.codex/hooks.json`, `.gemini/settings.json`, `.agents/hooks.json` |
| Extras     | `docs/ai-setup/settings.json`    | `.claude/settings.json`, `.gemini/settings.json`                                            |

`CLAUDE.md` e `GEMINI.md` da raiz são escritos à mão: importam `AGENTS.md` e acrescentam só o que é específico da ferramenta.

Depois de editar qualquer fonte: `node scripts/ai-sync.mjs` e uma sessão nova. O hook `pre-commit` e o CI rodam `--check`. Um hook de agente recusa edição em arquivo gerado.

## Antes do primeiro uso

1. Copie `.env.example` para `.env` e preencha.
2. Defina as mesmas variáveis no ambiente do seu usuário e reabra o terminal (Claude Code e Codex não leem o `.env`).
3. Abra cada ferramenta na raiz e aceite confiar no projeto. Aprove os servidores MCP e os hooks quando cada uma pedir.

## Como usar cada ferramenta

| Tarefa         | Claude Code | Codex CLI      | Gemini CLI     | Antigravity CLI |
| -------------- | ----------- | -------------- | -------------- | --------------- |
| Abrir          | `claude`    | `codex`        | `gemini`       | `agy`           |
| Ver instruções | `/context`  | peça um resumo | `/memory show` | `/context`      |
| Skills         | `/skills`   | `/skills`      | `/skills list` | `/skills`       |
| Usar uma skill | `/nome`     | `$nome`        | automático     | automático      |
| Subagentes     | `/agents`   | `/agent`       | `/agents`      | `/agents`       |
| Hooks          | `/hooks`    | `/hooks`       | `/hooks`       | `/hooks`        |
| MCP            | `/mcp`      | `/mcp`         | `/mcp`         | `/mcp`          |
